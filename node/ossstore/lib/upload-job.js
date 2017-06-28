'use strict';

var Base = require('./base');
var fs = require('fs');
var path = require('path');
var util = require('./upload-job-util');

class UploadJob extends Base {

  /**
   *
   * @param ossClient
   * @param config
   *    config.from {object|string}  {name, path} or /home/admin/a.jpg
   *    config.to   {object|string}  {bucket, key} or oss://bucket/test/a.jpg
   *    config.checkPoints  {object}
   *    config.status     {string} default 'waiting'
   *    config.prog   {object}  {loaded, total}
   *    config.crc64Str {string}
   *
   * events:
   *    statuschange(state) 'running'|'waiting'|'stopped'|'failed'|'finished'
   *    stopped
   *    error  (err)
   *    complete
   *    progress ({loaded:0, total: 1200})
   *    partcomplete  ({done: c, total: total}, checkPoint)
   */
  constructor(ossClient, config) {
    super();
    this.id= 'uj-'+new Date().getTime()+'-'+ ((''+Math.random()).substring(2));

    this.oss = ossClient;
    this._config = {};
    Object.assign(this._config, config);

    if (!this._config.from) {
      console.log('需要 from');
      return;
    }
    if (!this._config.to) {
      console.log('需要 to');
      return;
    }

    this.from = util.parseLocalPath(this._config.from);
    this.to = util.parseOssPath(this._config.to);
    this.region = this._config.region;

    this.prog = this._config.prog || {
        loaded: 0,
        total: 0
      };

    this.message = this._config.message;
    this.status = this._config.status || 'waiting';

    this.stopFlag = this.status!='running';

    this.checkPoints = this._config.checkPoints;

    this.crc64Str = this._config.crc64Str;

    //console.log('created upload job');
    this.maxConcurrency = 3;
  }
}


UploadJob.prototype.start = function () {
  var self = this;
  self.message='';
  this.startTime = new Date().getTime();
  this.endTime = null;
  this._changeStatus('running');
  this.stopFlag = false;

  util.getFileCrc64(self.from.path, function(err, crc64Str){
    if(err){
      self.message= err.message;
      self._changeStatus('failed');
      self.emit('error', err);
    }
    else{
      self.crc64Str = crc64Str || '';
      self.startUpload();
      self.startSpeedCounter();
    }
  });

  return this;
};

UploadJob.prototype.stop = function () {
  this.stopFlag = true;
  this._changeStatus('stopped');
  this.speed = 0;
  this.predictLeftTime = 0;
  return this;
};
UploadJob.prototype.wait = function () {
  this._changeStatus('waiting');
  this.stopFlag = true;
  return this;
};

//crc 校验失败，删除oss文件
UploadJob.prototype.deleteOssFile = function(){
   var self = this;
   self.oss.deleteObject({Bucket: self.to.bucket, Key: self.to.key}, function(err){
     if(err) console.error(err);
     else console.log('oss file [oss://'+  self.to.bucket+'/'+self.to.key+'] has been delete');
   });
};



UploadJob.prototype._changeStatus = function(status){
  var self= this;
  self.status=status;
  self.emit('statuschange',self.status);

  if(status=='failed' || status=='stopped' || status=='finished'){
    self.endTime = new Date().getTime();
    util.closeFD(this.keepFd);
  }
};

/**
 * 开始上传
 */
UploadJob.prototype.startUpload = function () {

  var self = this;

  util.prepareChunks(self.from.path, self.checkPoints, function (err, checkPoints) {

    if (err) {
      self.message= err.message;
      self._changeStatus('failed');
      self.emit('error', err);
      return;
    }

    self.checkPoints = checkPoints;

    //console.log('chunks.length:',checkPoints.chunks.length)
    if (checkPoints.chunks.length == 1 && checkPoints.chunks[0].start==0) {
      //console.log('uploadSingle')
      self.uploadSingle();
    } else {
      self.uploadMultipart(checkPoints);
    }
  });

};

UploadJob.prototype.startSpeedCounter = function(){
  var self = this;

  self.lastLoaded = 0;

  var tick = 0;
  self.speedTid = setInterval(function(){

    if(self.stopFlag){
      self.speed = 0;
      self.predictLeftTime= 0;
      return;
    }
    self.speed = self.prog.loaded - self.lastLoaded;
    self.lastLoaded=self.prog.loaded;

    //推测耗时
    self.predictLeftTime = self.speed == 0 ? 0 : Math.floor((self.prog.total-self.prog.loaded)/self.speed*1000);

    //根据speed 动态调整 maxConcurrency, 5秒修改一次
    tick++;
    if(tick>5){
      tick=0;
      if(self.speed > 5*1024*1024) self.maxConcurrency=10;
      else if(self.speed > 3*1024*1024) self.maxConcurrency=7;
      else if(self.speed > 2*1024*1024) self.maxConcurrency=5;
      else self.maxConcurrency=3;
      console.log('max concurrency:', self.maxConcurrency);
    }

  },1000);

  function onFinished(){
    clearInterval(self.speedTid);
    self.speed = 0;
    //推测耗时
    self.predictLeftTime=0;
  }

  self.on('stopped',onFinished);
  self.on('error', onFinished);
  self.on('complete',onFinished);
};



UploadJob.prototype.uploadSingle = function () {

  var self = this;
  var filePath = self.from.path;

  fs.readFile(filePath, function (err, data) {

    if (self.stopFlag) {
      return;
    }

    var params = {
      Bucket: self.to.bucket,
      Key: self.to.key,
      Body: data
    };


    self.prog = {
      loaded: 0,
      total: Buffer.byteLength(data)
    };

    var req = self.oss.putObject(params, function (err,data) {

      if (err) {
        self.message=err.message;
        self._changeStatus('failed');
        self.emit('error', err);
      }
      else {
        console.log('checking crc64Str:', self.crc64Str, data['HashCrc64ecma']);
        if(!self.crc64Str || self.crc64Str == data['HashCrc64ecma']){
          self._changeStatus('finished');
          self.emit('complete');
        }else{
          self.message="HashCrc64ecma not match";
          self._changeStatus('failed');
          self.emit('error', new Error(self.message));

          self.deleteOssFile();
        }
      }
    });

    req.on('httpUploadProgress', function (p) {

      if (self.stopFlag) {
        try {
          req.abort();
        } catch (e) {
        }
        return;
      }

      self.prog.loaded = p.loaded;
      self.emit('progress', JSON.parse(JSON.stringify(self.prog)));
    });
  });
};


/**
 * 分块上传
 * @param checkPoints
 */
UploadJob.prototype.uploadMultipart = function (checkPoints) {

  var self = this;

  var maxRetries = 100;


  var retries = {}; //重试次数 [partNumber]
  var concurrency = 0; //并发块数

  var uploadNumArr = util.genUploadNumArr(checkPoints);

  //var totalParts = checkPoints.chunks.length;

  var params = {
    Bucket: self.to.bucket,
    Key: self.to.key
  };

  self.prog.total = checkPoints.file.size;


  var keepFd;

  if (checkPoints.done) {
    self._changeStatus('finished');
    self.emit('partcomplete', util.getPartProgress(checkPoints), JSON.parse(JSON.stringify(checkPoints)));
    self.emit('complete');
    return;
  }

  util.getUploadId(checkPoints, self.oss, params, function (err, uploadId) {
    //console.log("Got upload ID", uploadId);


    fs.open(checkPoints.file.path, 'r', function (err, fd) {
      self.keepFd = keepFd = fd;


      self.emit('partcomplete', util.getPartProgress(checkPoints), JSON.parse(JSON.stringify(checkPoints)));

      if (util.checkAllPartCompleted(checkPoints)) {
        util.closeFD(fd);
        complete();
      }
      else {
        if (uploadNumArr.length > 0) {
          uploadPart(uploadNumArr.shift());
        }
      }
    });
  });

  // partNum: 0-n
  function uploadPart(partNum) {
    if (partNum == null)return;


    retries[partNum+1] = 0; //重试次数

    if (self.stopFlag) {
      util.closeFD(keepFd);
      return;
    }

    concurrency++;

    var curChunk = checkPoints.chunks[partNum];
    var len = curChunk.len;
    var start = curChunk.start;

    var bf = new Buffer(len);

    fs.read(keepFd, bf, 0, len, start, function (err, bfRead, buf) {

      if (err) {
        self.message=err.message;
        self._changeStatus('failed');
        self.emit('error', err);
        return;
      }

      var partParams = {
        Body: buf,
        Bucket: self.to.bucket,
        Key: self.to.key,
        PartNumber: (partNum + 1),
        UploadId: checkPoints.uploadId
      };

      doUpload(partParams);

      //如果concurrency允许, 再上传一块
      if (concurrency < self.maxConcurrency && uploadNumArr.length>0 && !self.stopFlag) {
        uploadPart(uploadNumArr.shift());
      }

    });
  }

  //上传块
  function doUpload(partParams){
    var partNumber = partParams.PartNumber; // start from 1


    if (self.stopFlag) {
      util.closeFD(keepFd);
      return;
    }

    //console.log('doUp-->:', partNumber);

    checkPoints.Parts[partNumber] = {
      PartNumber: partNumber,
      loaded: 0
    };

    var req = self.oss.uploadPart(partParams, function (multiErr, mData) {

      if (self.stopFlag) {
        util.closeFD(keepFd);
        return;
      }

      if (multiErr) {

        if(multiErr.code=='RequestAbortedError'){
          //用户取消
          console.warn('用户取消');
          return;
        }

        console.warn('multiErr, upload part error:', multiErr);
        if (retries[partNumber] >= maxRetries) {
          //console.error('上传分片失败: #', partNumber);
          util.closeFD(keepFd);
          self.message='上传分片失败: #'+partNumber;
          self._changeStatus('failed');
          self.emit('error', multiErr);
        }
        else {
          checkPoints.Parts[partNumber].loaded = 0;
          retries[partNumber]++;

          console.warn('将要重新上传分片: #', partNumber, ', 还可以重试'+(maxRetries-retries[partNumber])+'次');
          setTimeout(function(){
            console.warn('重新上传分片: #', partNumber);
            doUpload(partParams);
          }, 2000);
        }
        return;
      }


      checkPoints.Parts[partNumber].ETag = mData.ETag;
      checkPoints.Parts[partNumber].loaded = partParams.Body.byteLength;

      concurrency--;

      //console.log("Completed part", partNumber, totalParts, mData.ETag);

      self.emit('partcomplete', util.getPartProgress(checkPoints), JSON.parse(JSON.stringify(checkPoints)));

      if (util.checkAllPartCompleted(checkPoints)) {
        util.closeFD(keepFd);
        complete();
      }
      else {
        if( !self.stopFlag){
          uploadPart(uploadNumArr.shift());
        }
      }
    });


    //fix abort: _abortCallback is not a function
    req.httpRequest._abortCallback = function(){};


    req.on('httpUploadProgress', function (p) {

      if (self.stopFlag) {
        try {
          req.abort();
        } catch (e) {
          console.log(e.stack);
        }
        checkPoints.Parts[partNumber].loaded = 0;
        return;
      }


      checkPoints.Parts[partNumber].loaded = p.loaded;

      var loaded = 0;
      for (var k in checkPoints.Parts) {
        loaded += checkPoints.Parts[k].loaded;
      }


      self.prog.loaded = loaded;

      self.emit('progress',  self.prog);

    });
  }

  function complete() {
    console.log("Completing upload..., uploadId: ", checkPoints.uploadId);

    var parts = JSON.parse(JSON.stringify(checkPoints.Parts));
    var t=[];
    for (var k in parts) {
      delete parts[k].loaded;
      t.push(parts[k]);
    }
    t.sort(function(a,b){
      return a.PartNumber > b.PartNumber ? 1 : -1;
    });

    var completeState = {Parts:t};

    var doneParams = {
      Bucket: self.to.bucket,
      Key: self.to.key,
      CompleteMultipartUpload: completeState,
      UploadId: checkPoints.uploadId
    };

    self.oss.completeMultipartUpload(doneParams, function(err, data){

      if (err) {
        self.message=err.message;
        self._changeStatus('failed');
        self.emit('error', err);
      }
      else{
        console.log('checking crc64Str:', self.crc64Str, data['HashCrc64ecma']);
        if(!self.crc64Str || self.crc64Str == data['HashCrc64ecma']){
          checkPoints.done=true;
          self._changeStatus('finished');
          self.emit('complete');
        }else{
          self.message="HashCrc64ecma mismatch";
          self._changeStatus('failed');
          self.emit('error', new Error(self.message));
          self.deleteOssFile();
        }
      }

    });
  }

};

module.exports = UploadJob;

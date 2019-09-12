'use strict';

var Base = require('./base');
var fs = require('fs');
var path = require('path');
var util = require('./download-job-util');
var isDebug = process.env.NODE_ENV=='development';
var commonUtil = require('./util');
var RETRYTIMES = commonUtil.getRetryTimes();

class DownloadJob extends Base {

  /**
   *
   * @param ossClient
   * @param config
   *    config.from {object|string}  {bucket, key} or oss://bucket/test/a.jpg
   *    config.to   {object|string}  {name, path} or /home/admin/a.jpg
   *    config.checkPoint
   *
   *    config.chunkSize
   *    config.enableCrc64
   */
  constructor(ossClient, config) {
    super();
    this.id= 'dj-'+new Date().getTime()+'-'+ ((''+Math.random()).substring(2));
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

    this.from = util.parseOssPath(this._config.from); //oss path
    this.to = util.parseLocalPath(this._config.to); //local path
    this.region = this._config.region;

    this.prog = this._config.prog || {
      loaded: 0,
      total: 0
    };

    this.message = this._config.message;
    this.status = this._config.status || 'waiting';

    this.stopFlag = this.status != 'running';

    this.checkPoints = this._config.checkPoints;
    this.enableCrc64 = this._config.enableCrc64;

    //console.log('created download job');

    this.maxConcurrency = 15;
  }
}

DownloadJob.prototype.start = function () {
  var self = this;
  if(this.status=='running')return;

  if(this._lastStatusFailed){
    //从头开始
    this.checkPoints = {};
    this.crc64Str = '';
  }

  self.message='';
  self.startTime = new Date().getTime();
  self.endTime = null;

  self.stopFlag = false;
  self._changeStatus('running');

  self.checkPoints =  (self.checkPoints && self.checkPoints.Parts) ? self.checkPoints: {
    from: self.from,
    to: self.to,
    Parts: {}
  };

  self.startDownload(self.checkPoints);

  self.startSpeedCounter();

  return self;
};

DownloadJob.prototype.stop = function () {
  var self = this;
  if(self.status=='stopped')return;
  self.stopFlag = true;
  self._changeStatus('stopped');
  self.speed = 0;
  self.predictLeftTime = 0;
  return self;
};

DownloadJob.prototype.wait = function () {
  var self = this;
  if(this.status=='waiting')return;
  this._lastStatusFailed = this.status=='failed';
  self.stopFlag = true;
  self._changeStatus('waiting');
  return self;
};

DownloadJob.prototype._changeStatus = function (status, retryTimes) {
  var self = this;
  self.status = status;
  self.emit('statuschange', self.status, retryTimes);

  if (status == 'failed' || status == 'stopped' || status == 'finished') {
    self.endTime = new Date().getTime();
    //util.closeFD(self.keepFd);

    console.log('clear speed tid, status:', self.status)
    clearInterval(self.speedTid);
    self.speed = 0;
    //推测耗时
    self.predictLeftTime=0;
  }
};

DownloadJob.prototype.startSpeedCounter = function () {
  var self = this;

  self.lastLoaded = self.prog.loaded|| 0;
  self.lastSpeed = 0;
  var tick=0;
  clearInterval(self.speedTid);
  self.speedTid = setInterval(function () {

    if (self.stopFlag) {
      self.speed = 0;
      self.predictLeftTime = 0;
      return;
    }

    self.speed = self.prog.loaded - self.lastLoaded;
    console.log("self.speed.........." + self.speed)
    if(self.lastSpeed != self.speed) self.emit('speedChange',self.speed);
    self.lastSpeed = self.speed;
    self.lastLoaded = self.prog.loaded;


    //推测耗时
    self.predictLeftTime = self.speed == 0 ? 0 : Math.floor((self.prog.total - self.prog.loaded) / self.speed * 1000);

    //根据speed 动态调整 maxConcurrency, 5秒修改一次
    tick++;
    if(tick>5){
      tick=0;
      self.maxConcurrency = util.computeMaxConcurrency(self.speed, self.chunkSize,self.maxConcurrency);
      console.log('max concurrency:', self.maxConcurrency);
    }
  }, 1000);

  // function onFinished() {
  //   clearInterval(self.speedTid);
  //   self.speed = 0;
  //   //推测耗时
  //   self.predictLeftTime = 0;
  // }
  //
  // self.on('stopped', onFinished);
  // self.on('error', onFinished);
  // self.on('complete', onFinished);
};

/**
 * 开始download
 */
DownloadJob.prototype.startDownload = function (checkPoints) {
  var self = this;

  var _log_opt = {}

  var chunkNum = 0;
  var chunkSize = 0;
  //var keepFd;
  var chunks = [];


  var maxRetries = RETRYTIMES;

  var concurrency = 0;

  //console.log('maxConcurrency:', maxConcurrency);

  var tmpName = self.to.path + '.download';
  var fileMd5 = '';
  var hashCrc64ecma = '';

  var objOpt = {
    Bucket: self.from.bucket,
    Key: self.from.key
  };

  util.headObject(self, objOpt, function (err, headers) {
    if (err) {
      console.log(err)
      if(err.message.indexOf('Network Failure')!=-1
    || err.message.indexOf('getaddrinfo ENOTFOUND')!=-1){
        self.message = 'failed to get oss object meta: ' + err.message;
        //console.error(self.message);
        console.error(self.message, self.to.path);
        self.stop();
        //self.emit('error', err);
      }
      else{
        self.message = 'failed to get oss object meta: ' + err.message;
        //console.error(self.message);
        console.error(self.message, self.to.path);
        self._changeStatus('failed');
        self.emit('error', err);
      }
      return;
    }

    fileMd5 = headers.ContentMD5;//.replace(/(^\"*)|(\"*$)/g, '');
    //console.log('file md5:',fileMd5);
    hashCrc64ecma = headers.HashCrc64ecma;

    var contentLength = parseInt(headers['ContentLength']);
    self.prog.total = contentLength;
    //console.log('got content length:', contentLength)
    //空文件
    if (self.prog.total == 0) {

      fs.writeFile(self.to.path, '', function (err) {
        if (err) {
          self.message = 'failed to open local file:' + err.message;
          //console.error(self.message);
          console.error(self.message, self.to.path);
          self._changeStatus('failed');
          self.emit('error', err);

        } else {
          self._changeStatus('finished');
          self.emit('progress', {
            total: 0,
            loaded: 0
          });
          self.emit('partcomplete', {
            total: 0,
            done: 0
          });
          self.emit('complete');
          console.log('download: '+self.to.path+' %celapse','background:green;color:white',self.endTime-self.startTime,'ms')

        }
      });
      return;
    }

    if (self.stopFlag) {
      return;
    }


    chunkSize = checkPoints.chunkSize || self._config.chunkSize || util.getSensibleChunkSize(self.prog.total);

    self.chunkSize=chunkSize;

    console.log('chunkSize:',chunkSize);

    chunkNum = Math.ceil(self.prog.total / chunkSize);

    chunks = [];

    for (var i = 0; i < chunkNum; i++) {
      if (!checkPoints.Parts[i + 1] || !checkPoints.Parts[i + 1].done) {
        chunks.push(i);
        checkPoints.Parts[i + 1] = {
          PartNumber: i + 1,
          loaded: 0,
          done: false
        };
      }
    }


    //之前每个part都已经全部下载完成，状态还没改成完成的, 这种情况出现几率极少。
    if (chunks.length == 0) {
      //done

      for (var k in checkPoints.Parts) {
        self.prog.loaded += checkPoints.Parts[k].loaded;
      }
      self._changeStatus('verifying');
      util.checkFileHash(tmpName,  hashCrc64ecma , fileMd5,  function (err) {
        if (err) {
          self.message=(err.message||err);
          console.error(self.message, self.to.path);
          self._changeStatus('failed');
          self.emit('error', err);
          return;
        }

        //临时文件重命名为正式文件
        fs.rename(tmpName, self.to.path, function (err) {
          if (err) {
            console.log(err);
          } else {
            var progCp = JSON.parse(JSON.stringify(self.prog));
            self._changeStatus('finished');
            self.emit('progress', progCp);
            self.emit('partcomplete', {
              total: chunkNum,
              done: chunkNum
            });
            self.emit('complete');
            console.log('download: '+self.to.path+' %celapse','background:green;color:white',self.endTime-self.startTime,'ms')
          }
        });
      });
      return;
    }

    //downloadPart(getNextPart());
    createFileIfNotExists(tmpName, (err) => {
      if (err) {
        self.message = 'failed to open local file:' + err.message;
        //console.error(self.message);
        console.error(self.message, self.to.path);
        self._changeStatus('failed');
        self.emit('error', err);
        return;
      }

      if (self.stopFlag) {
        //util.closeFD(fd);
        return;
      }

      util.getFreeDiskSize(tmpName, function(err, freeDiskSize){
        console.log('got free disk size:',freeDiskSize, contentLength, freeDiskSize - contentLength)

        if(!err){
          if(contentLength > freeDiskSize - 10*1024*1024 ){
            // < 100MB warning
            self.message="Insufficient disk space";
            self.stop();
            return;
          }
        }

        downloadPart(getNextPart());
      });
    });

  });

  function createFileIfNotExists(p, fn) {
    if (!fs.existsSync(p)) {
      fs.writeFile(tmpName, '', fn);
    } else {
      fn();
    }
  }

  function downloadPart(n) {
    if (n == null) return;

    var partNumber = n + 1;
    if(checkPoints.Parts[partNumber].done){
      console.error('tmd', n);
      return;
    }

    var start = chunkSize * n;
    var end = (n + 1 < chunkNum) ? start + chunkSize : self.prog.total;



    //checkPoints.Parts[partNumber] = {
    //  PartNumber: partNumber,
    //  loaded: 0,
    //  done: false
    //};

    var retryCount = 0;

    var obj = JSON.parse(JSON.stringify(objOpt));

    obj.Range = `bytes=${start}-${end-1}`;

    //console.log(obj.Range);

    concurrency++;
    doDownload(n);

    while (hasNextPart() && concurrency < self.maxConcurrency) {
        concurrency++;
        downloadPart(getNextPart());
    }

    function doDownload(n) {
      if (n == null) return;


      _log_opt[partNumber] = {
        start: Date.now()
      };


      if (self.stopFlag) {
        //util.closeFD(keepFd);
        return;
      }
      //console.log('doDownload('+n+')')
      var req = self.oss.getObject(obj, (err, data) => {
        //console.log('getObject('+n+')', data)
        // var md5 = ALY.util.crypto.md5(data.Body,'hex');
        if (self.stopFlag) {
          //util.closeFD(keepFd);
          return;
        }




        if (err) {

          try {
            req.abort();
          } catch (e) {
            console.log(e.stack);
          }
          checkPoints.Parts[partNumber].loaded = 0;
          checkPoints.Parts[partNumber].done = false;

          //console.log(err);
          if (err.code == 'RequestAbortedError') {
            //用户取消
            console.warn('用户取消');
            return;
          }



          if(retryCount >= maxRetries){
            self.message = `failed to download part [${n}]: ${err.message}`;
            //console.error(self.message);
            console.error(self.message, self.to.path);
            //self._changeStatus('failed');
            self.stop();
            //self.emit('error', err);
            //util.closeFD(keepFd);
          }
          else if(err.code=='InvalidObjectState' ){
            self.message = `failed to download part [${n}]: ${err.message}`;
            //console.error(self.message);
            console.error(self.message, self.to.path);
            self._changeStatus('failed');
            self.emit('error', err);
            //util.closeFD(keepFd);
          }
          else{
            retryCount++;
            console.log(`retry download part [${n}] error:${err}, ${self.to.path}`);
            setTimeout(function(){
              doDownload(n);
            },2000);
          }
          return;
        }
        else if(data.Body.length!=parseInt(data.ContentLength)){
          //下载不完整，重试， 这里应该判断crc，但是考虑效率，先不做

          try {
            req.abort();
          } catch (e) {
            console.log(e.stack);
          }
          checkPoints.Parts[partNumber].loaded = 0;
          checkPoints.Parts[partNumber].done = false;

          retryCount++;
          console.warn(`retry download part [${n}] error: missing data, ${self.to.path}`);
          setTimeout(function(){
            doDownload(n);
          },2000);
          return;
        }

        //console.log(n, end - start, start, end, data.Body.length);
        writeFileRange(tmpName, data.Body, start, function (err) {

          if (self.stopFlag) {
            //util.closeFD(keepFd);
            return;
          }

          if (err) {
            self.message = 'failed to write local file: ' + err.message;
            //console.error(self.message);
            console.error(self.message, self.to.path);
            self._changeStatus('failed');
            self.emit('error', err);
            //util.closeFD(keepFd);
            return;
          }

          concurrency--;

          _log_opt[partNumber].end = Date.now();

          //self.prog.loaded += (end-start);

          checkPoints.Parts[partNumber].done = true;
          //checkPoints.Parts[partNumber].loaded = data.ContentLength;

          //var progCp = JSON.parse(JSON.stringify(self.prog));

          console.log(`complete part [${n}] ${self.to.path}`);

          //console.log(JSON.stringify(checkPoints.Parts,' ',2))

          var progInfo = util.getPartProgress(checkPoints.Parts)

          if (progInfo.done==progInfo.total) {
            //下载完成
            //util.closeFD(keepFd);
            //检验MD5
            self._changeStatus('verifying');
            util.checkFileHash(tmpName,  hashCrc64ecma, fileMd5, function (err) {
              if (err) {
                self.message = (err.message||err);
                console.error(self.message, self.to.path);
                self._changeStatus('failed');
                self.emit('error', err);
                return;
              }

              //临时文件重命名为正式文件
              fs.rename(tmpName, self.to.path, function (err) {
                if (err) {
                  console.error(err, self.to.path);
                } else {

                  self._changeStatus('finished');
                  //self.emit('progress', progCp);
                  self.emit('partcomplete', util.getPartProgress(checkPoints.Parts), checkPoints);
                  if(isDebug) util.printPartTimeLine(_log_opt);
                  self.emit('complete');
                  console.log('download: '+self.to.path+' %celapse','background:green;color:white',self.endTime-self.startTime,'ms')
                }

              });
            });
          } else {
            //self.emit('progress', progCp);
            self.emit('partcomplete', util.getPartProgress(checkPoints.Parts), checkPoints);
            downloadPart(getNextPart());
          }
        });
      });

      //fix abort: _abortCallback is not a function
      req.httpRequest._abortCallback = function () {};

      req.on('httpDownloadProgress', function (p) {
        checkPoints.Parts[partNumber].done = false;

        if (self.stopFlag) {
          try {
            req.abort();
          } catch (e) {
            console.log(e.stack);
          }
          checkPoints.Parts[partNumber].loaded = 0;
          checkPoints.Parts[partNumber].done = false;
          return;
        }

        checkPoints.Parts[partNumber].loaded = p.loaded;

        var loaded = 0;
        for (var k in checkPoints.Parts) {
          loaded += checkPoints.Parts[k].loaded;
        }

        self.prog.loaded = loaded;
        self.emit('progress', self.prog);

      });
    }
  }

  function getNextPart() {
    return chunks.shift();
  }

  function hasNextPart() {
    return chunks.length > 0;
  }



  // function writeFileRange(tmpName, data, start, fn) {
  //   fs.open(tmpName, 'a+', function(err, fd){
  //     fs.write(fd, data, 0, data.length,  start, fn)
  //   });
  // }
  function writeFileRange(tmpName, data, start, fn) {
    var file = fs.createWriteStream(tmpName, {
      start: start,
      flags: 'r+',
      autoClose: true,
    });
    file.end(data);
    file.on('error', (err) => {
      fn(err);
    });
    file.on('finish', () => {
      fn(null);
    });
  }
};

module.exports = DownloadJob;

'use strict';

var Base = require('./base');
var fs = require('fs');
var path = require('path');
var util = require('./download-job-util');

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

    //console.log('created download job');

    this.maxConcurrency = 3;
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

DownloadJob.prototype._changeStatus = function (status) {
  var self = this;
  self.status = status;
  self.emit('statuschange', self.status);

  if (status == 'failed' || status == 'stopped' || status == 'finished') {
    self.endTime = new Date().getTime();
    //util.closeFD(self.keepFd);

    console.log('clear speed tid', self.status)
    clearInterval(self.speedTid);
    self.speed = 0;
    //推测耗时
    self.predictLeftTime=0;
  }
};

DownloadJob.prototype.startSpeedCounter = function () {
  var self = this;

  self.lastLoaded = 0;
  var tick=0;
  clearInterval(self.speedTid);
  self.speedTid = setInterval(function () {

    if (self.stopFlag) {
      self.speed = 0;
      self.predictLeftTime = 0;
      return;
    }

    self.speed = self.prog.loaded - self.lastLoaded;
    self.lastLoaded = self.prog.loaded;

    //推测耗时
    self.predictLeftTime = self.speed == 0 ? 0 : Math.floor((self.prog.total - self.prog.loaded) / self.speed * 1000);

    //根据speed 动态调整 maxConcurrency, 5秒修改一次
    tick++;
    if(tick>5){
      tick=0;
      self.maxConcurrency = util.computeMaxConcurrency(self.speed);
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

  var chunkNum = 0;
  var chunkSize = 0;
  //var keepFd;
  var chunks = [];

  var completedCount = 0;
  var completedBytes = 0;

  var maxRetries = 100;

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
      self.message = 'failed to get oss object meta: ' + err.message;
      //console.error(self.message);
      console.error(self.message, self.to.path);
      self._changeStatus('failed');
      self.emit('error', err);
      return;
    }
    //console.log(headers)

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
        }
      });
      return;
    }

    if (self.stopFlag) {
      return;
    }

    chunkSize = checkPoints.chunkSize || self._config.chunkSize || util.getSensibleChunkSize(self.prog.total);

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

    completedCount = chunkNum - chunks.length;

    //之前每个part都已经全部下载完成，状态还没改成完成的, 这种情况出现几率极少。
    if (chunks.length == 0) {
      //done

      for (var k in checkPoints.Parts) {
        self.prog.loaded += checkPoints.Parts[k].loaded;
      }

      checkFileHash(tmpName, fileMd5, hashCrc64ecma, function (err) {
        if (err) {
          self.message="failed to check crc64:"+ (err.message||err);
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

      //util.closeFD(fd);
      downloadPart(getNextPart());
    });

  });

  function createFileIfNotExists(p, fn) {
    if (!fs.existsSync(p)) {
      //if todo: mkdir
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

    if (hasNextPart() && concurrency < self.maxConcurrency) {
      concurrency++;
      downloadPart(getNextPart());
    }

    function doDownload(n) {
      if (n == null) return;

      if (self.stopFlag) {
        //util.closeFD(keepFd);
        return;
      }

      var req = self.oss.getObject(obj, (err, data) => {
        // var md5 = ALY.util.crypto.md5(data.Body,'hex');
        if (self.stopFlag) {
          //util.closeFD(keepFd);
          return;
        }

        if (err) {
          //console.log(err);
          if (err.code == 'RequestAbortedError') {
            //用户取消
            console.warn('用户取消');
            return;
          }

          if (retryCount < maxRetries && err.code!='InvalidObjectState' ) {
            retryCount++;
            console.log(`retry download part [${n}] error:${err}, ${self.to.path}`);
            checkPoints.Parts[partNumber].loaded = 0;
            setTimeout(function(){
              doDownload(n);
            },2000);

          } else {
            self.message = `failed to download part [${n}]: ${err.message}`;
            //console.error(self.message);
            console.error(self.message, self.to.path);
            self._changeStatus('failed');
            self.emit('error', err);
            //util.closeFD(keepFd);
          }
          return;
        }


        //console.log(0, end - start, start, end);
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

          completedCount++;
          concurrency--;

          completedBytes += (end - start);

          //self.prog.loaded += (end-start);

          checkPoints.Parts[partNumber].done = true;

          //var progCp = JSON.parse(JSON.stringify(self.prog));

          console.log(`complete part [${n}] ${self.to.path}`);
          if (completedCount == chunkNum) {
            //下载完成
            //util.closeFD(keepFd);
            //检验MD5
            checkFileHash(tmpName, fileMd5, hashCrc64ecma, function (err) {
              if (err) {
                self.message = 'failed to check crc64:'+ (err.message||err);
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
                  self.emit('partcomplete', {
                    total: chunkNum,
                    done: completedCount
                  }, checkPoints);
                  self.emit('complete');
                }

              });
            });
          } else {
            //self.emit('progress', progCp);
            self.emit('partcomplete', {
              total: chunkNum,
              done: completedCount
            }, checkPoints);
            downloadPart(getNextPart());
          }
        });
      });

      //fix abort: _abortCallback is not a function
      req.httpRequest._abortCallback = function () {};

      req.on('httpDownloadProgress', function (p) {

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

  function checkFileHash(tmpName, fileMd5, hashCrc64ecma, fn) {
    console.time(`check crc64 ${tmpName}`);
    if(hashCrc64ecma){
      util.getFileCrc64(tmpName, function(err, crc64Str){
        console.timeEnd(`check crc64 ${tmpName}`);
        if (err) {
          fn(new Error('Checking file['+tmpName+'] crc64 hash failed: ' + err.message));
        } else if (crc64Str!=null && crc64Str != hashCrc64ecma) {
          fn(new Error('HashCrc64ecma mismatch, file['+tmpName+'] crc64 hash should be:'+hashCrc64ecma+', but we got:'+crc64Str));
        } else{
          console.info('check crc success: file['+tmpName+'],'+crc64Str)
          fn(null);
        }
      });
    }
    else if(fileMd5){

      //检验MD5
      util.getBigFileMd5(tmpName, function (err, md5str) {
        if (err) {
          fn(new Error('Checking md5 failed: ' + err.message));
        } else if (md5str != fileMd5) {
          fn(new Error('MD5 mismatch, file md5 should be:'+fileMd5+', but we got:'+md5str));
        } else fn(null);
      });
    }
    else{
      //没有MD5，不校验
      console.log(tmpName,',not found content md5, just pass');
      fn(null);
      return;
    }
  }

  function writeFileRange(tmpName, data, start, fn) {
    var file = fs.createWriteStream(tmpName, {
      start: start,
      flags: 'r+'
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

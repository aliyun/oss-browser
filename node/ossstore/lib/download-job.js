'use strict';

var Base = require('./base');
var fs = require('fs');
// var path = require('path');
var util = require('./download-job-util');
// var isDebug = process.env.NODE_ENV == 'development';
var commonUtil = require('./util');
var RETRYTIMES = commonUtil.getRetryTimes();
var fdSlicer = require('fd-slicer');
var stream = require('stream');

function getNextPart(chunks) {
  return chunks.shift();
}

function hasNextPart(chunks) {
  return chunks.length > 0;
}

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
  constructor(ossClient, config, aliOSS) {
    super();
    this.id = 'dj-' + new Date().getTime() + '-' + (('' + Math.random()).substring(2));
    this.oss = ossClient;
    this.aliOSS = aliOSS;
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

    this.maxConcurrency = parseInt(localStorage.getItem('downloadConcurrecyPartSize') || 15)

    this.crc64List = [];
    this.crc64Promise = [];
  }
}

DownloadJob.prototype.start = function () {
  var self = this;
  if (this.status == 'running') return;

  if (this._lastStatusFailed) {
    //从头开始
    this.checkPoints = {};
    this.crc64Str = '';
  }

  self.message = '';
  self.startTime = new Date().getTime();
  self.endTime = null;

  self.stopFlag = false;
  self._changeStatus('running');

  self.checkPoints = (self.checkPoints && self.checkPoints.Parts) ? self.checkPoints : {
    from: self.from,
    to: self.to,
    Parts: {}
  };

  self.startDownload(self.checkPoints);

  return self;
};

DownloadJob.prototype.stop = function () {
  var self = this;
  if (self.status == 'stopped') return;
  self.stopFlag = true;
  self._changeStatus('stopped');
  self.speed = 0;
  self.predictLeftTime = 0;
  return self;
};

DownloadJob.prototype.wait = function () {
  var self = this;
  if (this.status == 'waiting') return;
  this._lastStatusFailed = this.status == 'failed';
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
    self.predictLeftTime = 0;
  }
};

DownloadJob.prototype.startSpeedCounter = function () {
  var self = this;

  self.lastLoaded = self.prog.loaded || 0;
  self.lastSpeed = 0;
  var tick = 0;
  clearInterval(self.speedTid);
  self.speedTid = setInterval(function () {

    if (self.stopFlag) {
      self.speed = 0;
      self.predictLeftTime = 0;
      return;
    }

    self.speed = self.prog.loaded - self.lastLoaded;
    // console.log("self.speed.........." + self.speed)
    if (self.lastSpeed != self.speed) self.emit('speedChange', self.speed);
    self.lastSpeed = self.speed;
    self.lastLoaded = self.prog.loaded;

    //推测耗时
    self.predictLeftTime = self.speed == 0 ? 0 : Math.floor((self.prog.total - self.prog.loaded) / self.speed * 1000);

    //根据speed 动态调整 maxConcurrency, 5秒修改一次
    tick++;
    if (tick > 5) {
      tick = 0;
      self.maxConcurrency = util.computeMaxConcurrency(self.speed, self.chunkSize, self.maxConcurrency);
      // console.log('max concurrency:', self.maxConcurrency);
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
DownloadJob.prototype.startDownload = async function (checkPoints) {
  var self = this;

  self._log_opt = {}

  var chunkNum = 0;
  var chunkSize = 0;
  //var keepFd;
  var chunks = [];

  var maxRetries = RETRYTIMES;

  var concurrency = 0;

  var tmpName = self.to.path + '.download';
  var fileMd5 = '';
  var hashCrc64ecma = '';

  var objOpt = {
    Bucket: self.from.bucket,
    Key: self.from.key
  };
  this.aliOSS.useBucket(self.from.bucket);
  let headers;
  try {
    headers = await util.headObject(self, objOpt);
  } catch (err) {
    if (err.message.indexOf('Network Failure') != -1
      || err.message.indexOf('getaddrinfo ENOTFOUND') != -1) {
      self.message = 'failed to get oss object meta: ' + err.message;
      //console.error(self.message);
      console.error(self.message, self.to.path);
      self.stop();
      //self.emit('error', err);
    } else {
      self.message = 'failed to get oss object meta: ' + err.message;
      //console.error(self.message);
      console.error(self.message, self.to.path);
      self._changeStatus('failed');
      self.emit('error', err);
    }
    return;
  }

  // fileMd5 = headers['content-md5'];//.replace(/(^\"*)|(\"*$)/g, '');
  //console.log('file md5:',fileMd5);
  hashCrc64ecma = headers['x-oss-hash-crc64ecma'];

  var contentLength = parseInt(headers['content-length']);
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
        console.log('download: ' + self.to.path + ' %celapse', 'background:green;color:white', self.endTime - self.startTime, 'ms')

      }
    });
    return;
  }

  if (self.stopFlag) {
    return;
  }

  chunkSize = checkPoints.chunkSize || self._config.chunkSize || util.getSensibleChunkSize(self.prog.total);

  // chunkSize = 4 * 1024 * 1024;
  // chunkSize = 4 * 1024;
  // self.chunkSize=chunkSize;

  // console.log('chunkSize:',chunkSize);

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
    slef._calProgress(checkPoints);
    self._changeStatus('verifying');
    await self._complete(tmpName, hashCrc64ecma, checkPoints);
    return;
  }

  try {
    util.createFileIfNotExists(tmpName);
  } catch (err) {
    self.message = 'failed to open local file:' + err.message;
    console.error(self.message, self.to.path);
    self._changeStatus('failed');
    self.emit('error', err);
    return;
  }
  if (self.stopFlag) {
    return;
  }
  const fd = fs.openSync(tmpName, 'a+');
  self.slicer = fdSlicer.createFromFd(fd);
  self.fd = fd;

  util.getFreeDiskSize(tmpName, function (err, freeDiskSize) {
    console.log('got free disk size:', freeDiskSize, contentLength, freeDiskSize - contentLength)
    if (!err) {
      if (contentLength > freeDiskSize - 10 * 1024 * 1024) {
        // < 100MB warning
        self.message = "Insufficient disk space";
        self.stop();
        return;
      }
    }

    self.startSpeedCounter();
    downloadPart(getNextPart(chunks));
  });

  function downloadPart(n) {
    if (n == null) return;

    var partNumber = n + 1;
    if (checkPoints.Parts[partNumber].done) {
      console.error(`part [${n}] has finished`);
      return;
    }

    var start = chunkSize * n;
    var end = (n + 1 < chunkNum) ? start + chunkSize : self.prog.total;

    var retryCount = 0;

    concurrency++;
    doDownload(n);

    if (hasNextPart(chunks) && concurrency < self.maxConcurrency) {
      downloadPart(getNextPart(chunks));
    }

    function doDownload(n) {
      if (n == null) return;

      if (self.stopFlag) {
        return;
      }

      self._log_opt[partNumber] = {
        start: Date.now()
      };

      self.aliOSS.getStream(objOpt.Key, {
        headers: {
          Range: `bytes=${start}-${end - 1}`
        }
      }).then((res) => {
        if (self.stopFlag) {
          // util.closeFD(self.fd);
          return;
        }
        const fileStream = self.slicer.createWriteStream({start: start});
        // const buffers = [];
        res.stream.on('data', function (chunk) {
          // buffers.push(chunk);
          checkPoints.Parts[partNumber].done = false;
          checkPoints.Parts[partNumber].loaded = checkPoints.Parts[partNumber].loaded + chunk.length;
          self._calProgress(checkPoints);
        });
        self._calPartCRC64Stream(res.stream, partNumber, end - start);
        res.stream.pipe(fileStream).on('finish', async function () {
          // if (!self.crc64List[partNumber - 1]) {
          //   const err = new Error();
          //   err.message = 'crc64校验失败';
          //   throw new Error()
          // }
          concurrency--;

          self._log_opt[partNumber].end = Date.now();
          checkPoints.Parts[partNumber].done = true;

          console.log(`part [${partNumber}] complete: ${self.to.path}`);

          self._calProgress(checkPoints);
          var progInfo = util.getPartProgress(checkPoints.Parts)
          if (progInfo.done == progInfo.total) {
            //下载完成
            //检验MD5
            self._changeStatus('verifying');

            // 确保所有crc64已经校验完成
            await self._complete(tmpName, hashCrc64ecma, checkPoints);
            util.printPartTimeLine(self._log_opt);
          } else {
            //self.emit('progress', progCp);
            self.emit('partcomplete', util.getPartProgress(checkPoints.Parts), checkPoints);
            if (self.stopFlag) {
              return;
            }
            downloadPart(getNextPart(chunks));
          }
        })
          .on('error', function (err) {
            throw err;
          })
      }).catch(function (err) {
        console.error('download error', err)
        checkPoints.Parts[partNumber].loaded = 0;
        checkPoints.Parts[partNumber].done = false;
        // TODO code 状态码修复
        if (err.code == 'RequestAbortedError') {
          // 必须用callback 而不是 promise 方式才能 abort 请求;
          //用户取消
          console.warn('用户取消');
          return;
        }

        if (retryCount >= maxRetries) {
          self.message = `failed to download part [${n}]: ${err.message}`;
          //console.error(self.message);
          console.error(self.message, self.to.path);
          //self._changeStatus('failed');
          self.stop();
          //self.emit('error', err);
          //util.closeFD(keepFd);
        } else if (err.code == 'InvalidObjectState') {
          self.message = `failed to download part [${n}]: ${err.message}`;
          //console.error(self.message);
          console.error(self.message, self.to.path);
          self._changeStatus('failed');
          self.emit('error', err);
          //util.closeFD(keepFd);
        } else {
          retryCount++;
          console.log(`retry download part [${n}] error:${err}, ${self.to.path}`);
          setTimeout(function () {
            doDownload(n);
          }, 2000);
        }
      });
    }
  }
};

// DownloadJob.prototype._calPartCRC64 = function (buffersAll, partNumber) {
//   const self = this;
//   const len = buffersAll.length;
//   const start = new Date();
//   self.crc64Promise.push(util.getBufferCrc64(buffersAll).then(data => {
//       console.log(`part ${partNumber} crc64 finish use: '${((+new Date()) - start)} ms, crc64 is ${data}`);
//       self.crc64List[partNumber - 1] = {
//         crc64: data,
//         len: len
//       }
//     }).catch(err => {
//       self.message = '分片校验失败';
//       console.error(self.message, self.to.path);
//       self._changeStatus('failed');
//       self.emit('error', err);
//     })
//   );
// }


/**
 * 异步计算分片crc64
 * @param s
 * @private
 */
DownloadJob.prototype._calPartCRC64Stream = function (s, partNumber, len) {
  var streamCpy = s.pipe(new stream.PassThrough());
  const self = this;
  const start = new Date();
  const res = util.getStreamCrc64(streamCpy).then(data => {
    console.log(`part [${partNumber}] crc64 finish use: '${((+new Date()) - start)} ms, crc64 is ${data}`);
    self.crc64List[partNumber - 1] = {
      crc64: data,
      len: len
    }
  }).catch(err => {
    self.message = '分片校验失败';
    self.checkPoints.Parts[partNumber].loaded = 0;
    self.checkPoints.Parts[partNumber].done = false;
    console.error(self.message, self.to.path, err);
    self.stop();
    self._changeStatus('failed');
    self.emit('error', err);
  })
  self.crc64Promise.push(res);
  return res;
}

/**
 * 计算当前下载进度
 * @param checkPoints
 * @private
 */
DownloadJob.prototype._calProgress = function (checkPoints) {
  var loaded = 0;
  for (var k in checkPoints.Parts) {
    loaded += checkPoints.Parts[k].loaded;
  }
  this.prog.loaded = loaded;
  this.emit('progress', this.prog);
}

/**
 * 完成文件下载及校验
 * @param tmpName
 * @param hashCrc64ecma
 * @param checkPoints
 * @returns {Promise<void>}
 * @private
 */
DownloadJob.prototype._complete = async function (tmpName, hashCrc64ecma, checkPoints) {
  // 确保所有crc64已经校验完成
  const start = new Date();
  const self = this;
  try {
    await Promise.all(self.crc64Promise);
    const res = await util.combineCrc64(self.crc64List);
    console.log('combine crc64  use: ' + ((+new Date()) - start) + 'ms');
    if (res === hashCrc64ecma) {
      //临时文件重命名为正式文件
      fs.rename(tmpName, self.to.path, function (err) {
        if (err) {
          console.error(err, self.to.path);
          throw err;
        } else {
          self._changeStatus('finished');
          //self.emit('progress', progCp);
          self.emit('partcomplete', util.getPartProgress(checkPoints.Parts), checkPoints);
          self.emit('complete');
          util.closeFD(self.fd);
          console.log('download: ' + self.to.path + ' %celapse', 'background:green;color:white', self.endTime - self.startTime, 'ms')
        }
      });
    } else {
      const error = new Error();
      error.message = '文件校验不匹配，请删除文件重新下载';
      throw error;
    }
  } catch (err) {
    self.message = (err.message || err);
    console.error(self.message, self.to.path, self.crc64List);
    self._changeStatus('failed');
    self.emit('error', err);
  }
}

module.exports = DownloadJob;

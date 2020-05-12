"use strict";

var Base = require("./base");
var fs = require("fs");
var path = require("path");
var util = require("./upload-job-util");
var isDebug = process.env.NODE_ENV == "development";
var mime = require("mime");
var commonUtil = require("./util");
var RETRYTIMES = commonUtil.getRetryTimes();

// isLog==1 open else close
var isLog = localStorage.getItem("logFile") || 0;
var isLogInfo = localStorage.getItem("logFileInfo") || 0;
//本地日志收集模块
var log = require("electron-log");

var { ipcRenderer } = require("electron");

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
    this.id =
      "uj-" + new Date().getTime() + "-" + ("" + Math.random()).substring(2);

    this.oss = ossClient;
    this._config = {};
    Object.assign(this._config, config);

    if (!this._config.from) {
      console.log("需要 from");
      return;
    }
    if (!this._config.to) {
      console.log("需要 to");
      return;
    }

    this.from = util.parseLocalPath(this._config.from);
    this.to = util.parseOssPath(this._config.to);
    this.region = this._config.region;

    this.prog = this._config.prog || {
      loaded: 0,
      total: 0,
    };

    this.message = this._config.message;
    this.status = this._config.status || "waiting";

    this.stopFlag = this.status != "running";
    this.checkPoints = this._config.checkPoints;
    this.crc64Str = this._config.crc64Str;

    //console.log('created upload job');
    this.maxConcurrency = 5;
  }
}

UploadJob.prototype.start = function () {
  var self = this;

  if (this.status == "running") return;

  if (this._lastStatusFailed) {
    //从头上传
    this.checkPoints = {};
    this.crc64Str = "";
  }

  if (isDebug) console.log("-----start", self.from.path);

  if (isLog == 1 && isLogInfo == 1) {
    log.transports.file.level = "info";
    log.info(`----start ${self.from.path}`);
  }

  self.message = "";
  this.startTime = new Date().getTime();
  this.endTime = null;
  this._changeStatus("running");
  this.stopFlag = false;
  self._hasCallComplete = false;

  //开始
  self.startUpload();
  self.startSpeedCounter();

  return this;
};

UploadJob.prototype.stop = function () {
  this.stopFlag = true;
  clearInterval(self.speedTid);
  this._changeStatus("stopped");
  this.speed = 0;
  this.predictLeftTime = 0;

  if (isDebug) console.log("-----stop", this.from.path);

  if (isLog == 1 && isLogInfo == 1) {
    log.transports.file.level = "info";
    log.info(`-----stop ${this.from.path}`);
  }

  return this;
};
UploadJob.prototype.wait = function () {
  this._lastStatusFailed = this.status == "failed";
  this._changeStatus("waiting");
  this.stopFlag = true;

  if (isDebug) console.log("-----wait", this.from.path);

  if (isLog == 1 && isLogInfo == 1) {
    log.transports.file.level = "info";
    log.info(`-----wait ${this.from.path}`);
  }

  return this;
};

//crc 校验失败，删除oss文件
UploadJob.prototype.deleteOssFile = function () {
  var self = this;
  self.oss.deleteObject({ Bucket: self.to.bucket, Key: self.to.key }, function (
    err
  ) {
    if (err) console.error(err);
    else
      console.log(
        "crc64 verifying failed, oss file [oss://" +
          self.to.bucket +
          "/" +
          self.to.key +
          "] is deleted"
      );
  });
};

UploadJob.prototype._changeStatus = function (status, retryTimes) {
  var self = this;
  self.status = status;
  self.emit("statuschange", self.status, retryTimes);

  if (status == "failed" || status == "stopped" || status == "finished") {
    self.endTime = new Date().getTime();
    //util.closeFD(self.keepFd);

    //console.log('clear speed tid')
    clearInterval(self.speedTid);
    self.speed = 0;
    //推测耗时
    self.predictLeftTime = 0;
  }
};

/**
 * 开始上传
 */
UploadJob.prototype.startUpload = function () {
  var self = this;

  if (isDebug) console.log("prepareChunks", self.from.path);

  if (isLog == 1 && isLogInfo == 1) {
    log.transports.file.level = "info";
    log.info(`prepareChunks ${self.from.path}`);
  }

  util.prepareChunks(self.from.path, self.checkPoints, function (
    err,
    checkPoints
  ) {
    if (err) {
      self.message = err.message;
      self._changeStatus("failed");
      self.emit("error", err);
      return;
    }

    self.checkPoints = checkPoints;
    //console.log(checkPoints)

    //console.log('chunks.length:',checkPoints.chunks.length)
    if (checkPoints.chunks.length == 1 && checkPoints.chunks[0].start == 0) {
      if (isDebug) console.log("uploadSingle", self.from.path);

      if (isLog == 1 && isLogInfo == 1) {
        log.transports.file.level = "info";
        log.info(`uploadSingle ${self.from.path}`);
      }

      self.uploadSingle();
    } else {
      if (isDebug) console.log("uploadMultipart", self.from.path);

      if (isLog == 1 && isLogInfo == 1) {
        log.transports.file.level = "info";
        log.info(`uploadMultipart ${self.from.pathh}`);
      }

      self.uploadMultipart(checkPoints);
    }
  });
};

UploadJob.prototype.startSpeedCounter = function () {
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
    if (self.lastSpeed != self.speed) self.emit("speedChange", self.speed);
    self.lastSpeed = self.speed;
    self.lastLoaded = self.prog.loaded;

    //推测耗时
    self.predictLeftTime =
      self.speed == 0
        ? 0
        : Math.floor(
            ((self.prog.total - self.prog.loaded) / self.speed) * 1000
          );

    //根据speed 动态调整 maxConcurrency, 5秒修改一次
    tick++;
    if (tick > 5) {
      tick = 0;
      self.maxConcurrency = util.computeMaxConcurrency(
        self.speed,
        self.checkPoints.chunkSize,
        self.maxConcurrency
      );
      if (isDebug)
        console.info(
          "set max concurrency:",
          self.maxConcurrency,
          self.from.path
        );

      if (isLog == 1 && isLogInfo == 1) {
        log.transports.file.level = "info";
        log.info(
          `set max concurrency: ${self.maxConcurrency} ${self.from.path}`
        );
      }
    }
  }, 1000);
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
      Body: data,
      ContentType: mime.lookup(self.from.path),
    };

    self.prog = {
      loaded: 0,
      total: Buffer.byteLength(data),
    };

    var retryTimes = 0;
    _dig();
    function _dig() {
      var req = self.oss.putObject(params, function (err, data) {
        //console.log('[putObject] returns:',err,JSON.stringify(data))
        if (err) {
          if (
            err.message.indexOf("Access denied") != -1 ||
            err.message.indexOf("You have no right to access") != -1 ||
            retryTimes > RETRYTIMES
          ) {
            self.message = err.message;
            self._changeStatus("failed");
            self.emit("error", err);
          } else {
            retryTimes++;
            self._changeStatus("retrying", retryTimes);
            console.warn(
              "put object error:",
              err,
              ", -------retrying...",
              `${retryTimes}/${RETRYTIMES}'`
            );

            if (isLog == 1) {
              log.transports.file.level = "info";
              log.error(
                `put object error: ${err} -------retrying...${retryTimes}/${RETRYTIMES}`
              );
            }

            setTimeout(function () {
              _dig();
            }, 2000);
          }
        } else {
          self._changeStatus("verifying");
          util.checkFileHash(
            self.from.path,
            data["HashCrc64ecma"],
            data["ContentMD5"],
            function (err) {
              if (err) {
                self.message = err.message || err;
                console.error(self.message, self.to.path);
                self._changeStatus("failed");
                self.emit("error", err);
                self.deleteOssFile();
              } else {
                self._changeStatus("finished");
                self.emit("complete");
                console.log(
                  "upload: " + self.from.path + " %celapse",
                  "background:green;color:white",
                  self.endTime - self.startTime,
                  "ms"
                );
              }
            }
          );
        }
      });

      req.on("httpUploadProgress", function (p) {
        if (self.stopFlag) {
          try {
            req.abort();
          } catch (e) {}
          return;
        }

        self.prog.loaded = p.loaded;
        self.emit("progress", JSON.parse(JSON.stringify(self.prog)));
      });
    }
  });
};

/**
 * 分块上传
 * @param checkPoints
 */
UploadJob.prototype.uploadMultipart = function (checkPoints) {
  var self = this;

  var maxRetries = RETRYTIMES;

  var retries = {}; //重试次数 [partNumber]
  var concurrency = 0; //并发块数

  var _log_opt = {};

  var uploadNumArr = util.genUploadNumArr(checkPoints);
  if (isDebug)
    console.log("upload part nums:", uploadNumArr.join(","), self.from.path);

  if (isLog == 1 && isLogInfo == 1) {
    log.transports.file.level = "info";
    log.info(`upload part nums: ${uploadNumArr.join(",")} ${self.from.path}`);
  }

  //var totalParts = checkPoints.chunks.length;

  var params = {
    Bucket: self.to.bucket,
    Key: self.to.key,
    ContentType: mime.lookup(self.from.path),
  };
  self.prog.total = checkPoints.file.size;

  var keepFd;

  if (checkPoints.done) {
    self._changeStatus("finished");
    self.emit(
      "partcomplete",
      util.getPartProgress(checkPoints),
      JSON.parse(JSON.stringify(checkPoints))
    );
    self.emit("complete");
    console.log(
      "upload: " + self.from.path + " %celapse",
      "background:green;color:white",
      self.endTime - self.startTime,
      "ms"
    );

    return;
  }

  util.getUploadId(checkPoints, self, params, function (err, uploadId) {
    if (err) {
      console.error("can not get uploadId:", err);
      self.message = err.message;
      self._changeStatus("failed");
      self.emit("error", err);
      return;
    }

    if (isDebug) console.info("Got upload ID", err, uploadId, self.from.path);

    if (isLog == 1 && isLogInfo == 1) {
      log.transports.file.level = "info";
      log.info(`Got upload ID: ${err} ${uploadId} ${self.from.path}`);
    }

    fs.open(checkPoints.file.path, "r", function (err, fd) {
      fs.closeSync(fd);
      //console.log('fs. open', err, fd)
      if (err) {
        console.error("can not open file", checkPoints.file.path, err);
        self.message = err.message;
        self._changeStatus("failed");
        self.emit("error", err);
        return;
      }
      //self.keepFd = keepFd = fd;
      var progressInfo = util.getPartProgress(checkPoints);

      self.emit(
        "partcomplete",
        progressInfo,
        JSON.parse(JSON.stringify(checkPoints))
      );

      if (progressInfo.done == progressInfo.total) {
        //util.closeFD(fd);
        complete();
      } else {
        //console.log(concurrency , self.maxConcurrency);
        if (
          concurrency < self.maxConcurrency &&
          uploadNumArr.length > 0 &&
          !self.stopFlag
        ) {
          doUploadPart(uploadNumArr.shift());
        }
      }
    });
  });

  function readBytes(p, bf, offset, len, start, fn) {
    fs.open(p, "r", function (err, fd) {
      if (err) {
        fn(err);
        return;
      }
      fs.read(fd, bf, offset, len, start, function (err, bfRead, buf) {
        fs.closeSync(fd);
        if (err) {
          fn(err);
        } else {
          fn(null, bfRead, buf);
        }
      });
    });
  }

  // partNum: 0-n
  function doUploadPart(partNum) {
    if (partNum == null) return;
    //if(!keepFd) return;

    //fix Part重复上传
    if (checkPoints.Parts[partNum + 1].ETag) {
      console.error("tmd", partNum + 1);
      return;
    }

    if (isDebug)
      console.log(
        "doUploadPart:",
        partNum,
        ", stopFlag:",
        self.stopFlag,
        self.from.path
      );

    if (isLog == 1 && isLogInfo == 1) {
      log.transports.file.level = "info";
      log.info(
        `doUploadPart: ${partNum}  stopFlag: ${self.stopFlag} ${self.from.path}`
      );
    }

    retries[partNum + 1] = 0; //重试次数

    if (self.stopFlag) {
      //util.closeFD(keepFd);
      return;
    }

    concurrency++;

    var curChunk = checkPoints.chunks[partNum];
    var len = curChunk.len;
    var start = curChunk.start;

    var bf = new Buffer(len);

    readBytes(self.from.path, bf, 0, len, start, function (err, bfRead, buf) {
      if (err) {
        self.message = err.message;
        self._changeStatus("failed");
        self.emit("error", err);
        return;
      }

      var partParams = {
        Body: buf,
        Bucket: self.to.bucket,
        Key: self.to.key,
        PartNumber: partNum + 1,
        UploadId: checkPoints.uploadId,
      };

      doUpload(partParams);

      //如果concurrency允许, 再上传一块
      //console.info('当前并发:', concurrency, '最大并发:', self.maxConcurrency)
      if (
        concurrency < self.maxConcurrency &&
        uploadNumArr.length > 0 &&
        !self.stopFlag
      ) {
        doUploadPart(uploadNumArr.shift());
      }
    });
  }

  //上传块
  function doUpload(partParams) {
    var partNumber = partParams.PartNumber; // start from 1
    _log_opt[partNumber] = {
      start: Date.now(),
    };

    if (self.stopFlag) {
      //util.closeFD(keepFd);
      return;
    }

    checkPoints.Parts[partNumber] = {
      PartNumber: partNumber,
      loaded: 0,
    };

    var req = self.oss.uploadPart(partParams, function (multiErr, mData) {
      if (self.stopFlag) {
        //util.closeFD(keepFd);
        return;
      }

      //console.log(mData)

      if (multiErr) {
        try {
          req.abort();
        } catch (e) {
          console.log(e.stack);
        }
        checkPoints.Parts[partNumber].ETag = null;
        checkPoints.Parts[partNumber].loaded = 0;

        if (multiErr.code == "RequestAbortedError") {
          //用户取消
          console.warn("用户取消");
          return;
        }

        console.warn(
          "multiErr, upload part error:",
          multiErr.message || multiErr,
          partParams,
          self.from.path
        );

        if (retries[partNumber] >= maxRetries) {
          self.message = "上传分片失败: #" + partNumber;

          self.stop();
          //self.emit('error', multiErr);
          concurrency--;
        } else if (
          multiErr.message.indexOf("The specified upload does not exist") != -1
        ) {
          //console.error('上传分片失败: #', partNumber);
          //util.closeFD(keepFd);
          self.message = "上传分片失败: #" + partNumber;
          self._changeStatus("failed");
          self.emit("error", multiErr);
          concurrency--;

          //todo:
          //multiErr, upload part error: Error: Missing required key 'UploadId' in params
        } else {
          retries[partNumber]++;
          // 分片重试次数
          self._changeStatus("retrying", retries[partNumber]);
          console.warn(
            "将要重新上传分片: #",
            partNumber,
            ", 还可以重试" + (maxRetries - retries[partNumber]) + "次"
          );
          setTimeout(function () {
            console.warn("重新上传分片: #", partNumber);
            doUpload(partParams);
          }, 2000);
        }
        return;
      }

      checkPoints.Parts[partNumber].ETag = mData.ETag;
      checkPoints.Parts[partNumber].loaded = partParams.Body.byteLength;

      concurrency--;

      //console.log("Completed part", partNumber, totalParts, mData.ETag);
      _log_opt[partNumber].end = Date.now();
      var progressInfo = util.getPartProgress(checkPoints);
      self.emit(
        "partcomplete",
        progressInfo,
        JSON.parse(JSON.stringify(checkPoints))
      );

      if (progressInfo.done == progressInfo.total) {
        //util.closeFD(keepFd);
        if (isDebug) util.printPartTimeLine(_log_opt);

        complete();
      } else {
        //console.info('当前并发:', concurrency, '最大并发:', self.maxConcurrency)
        if (
          concurrency < self.maxConcurrency &&
          uploadNumArr.length > 0 &&
          !self.stopFlag
        ) {
          doUploadPart(uploadNumArr.shift());
        }
      }
    });

    //fix abort: _abortCallback is not a function
    req.httpRequest._abortCallback = function () {};

    req.on("httpUploadProgress", function (p) {
      checkPoints.Parts[partNumber].ETag = null;
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
      self.emit("progress", self.prog);
    });
  }

  function complete() {
    console.info("Completing upload..., uploadId: ", checkPoints.uploadId);

    //防止多次complete
    if (self._hasCallComplete) {
      //console.log('多次提交')
      return;
    }
    self._hasCallComplete = true;

    var parts = JSON.parse(JSON.stringify(checkPoints.Parts));
    var t = [];
    for (var k in parts) {
      delete parts[k].loaded;
      t.push(parts[k]);
    }
    t.sort(function (a, b) {
      return a.PartNumber > b.PartNumber ? 1 : -1;
    });

    var completeState = { Parts: t };

    var doneParams = {
      Bucket: self.to.bucket,
      Key: self.to.key,
      CompleteMultipartUpload: completeState,
      UploadId: checkPoints.uploadId,
    };

    // console.log('4444444', doneParams)
    //
    // if(!self._mm) self._mm={};
    // if(!self._mm[doneParams.UploadId]) self._mm[doneParams.UploadId]=1;
    // else console.error(doneParams.UploadId, '已经complete过一次了');
    //
    console.log("-->completeMultipartUpload sending...", doneParams.UploadId);
    console.time("completeMultipartUpload:" + doneParams.UploadId);
    util.completeMultipartUpload(self, doneParams, function (err, data) {
      console.timeEnd("completeMultipartUpload:" + doneParams.UploadId);
      console.log(
        "[completeMultipartUpload] returns:",
        err,
        JSON.stringify(data)
      );
      if (err) {
        console.error("[" + doneParams.UploadId + "]", err, doneParams);
        self.message = err.message;
        self._changeStatus("failed");
        self.emit("error", err);
      } else {
        self._changeStatus("verifying");
        util.checkFileHash(
          self.from.path,
          data["HashCrc64ecma"],
          data["ContentMD5"],
          function (err) {
            if (err) {
              self.message = err.message || err;
              console.error(self.message, self.to.path);
              self._changeStatus("failed");
              self.emit("error", err);
              self.deleteOssFile();
            } else {
              checkPoints.done = true;
              self._changeStatus("finished");
              self.emit("complete");
              console.log(
                "upload: " + self.from.path + " %celapse",
                "background:green;color:white",
                self.endTime - self.startTime,
                "ms"
              );
            }
          }
        );
      }
    });
  }
};

module.exports = UploadJob;

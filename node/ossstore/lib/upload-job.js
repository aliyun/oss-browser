"use strict";

var Base = require("./base");
var fs = require("fs");
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
  constructor(ossClient, config, aliOSS) {
    super();
    this.id =
      "uj-" + new Date().getTime() + "-" + ("" + Math.random()).substring(2);

    this.oss = ossClient;
    this.aliOSS = aliOSS;
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
    this._log_opt = this._config._log_opt || {};

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

  self.aliOSS.useBucket(self.to.bucket);
  //开始
  self.startUpload();
  // self.startSpeedCounter();

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
      self.startSpeedCounter();
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

  const readStream = fs.createReadStream(filePath);
  const total = fs.statSync(filePath).size;

  self.prog = {
    loaded: 0,
    total,
  };

  readStream.on("data", (chunk) => {
    if (self.stopFlag) {
      try {
        readStream.destroy();
      } catch (e) {
        //
      }
      return;
    }

    self.prog.loaded += chunk.length;
    self.emit("progress", JSON.parse(JSON.stringify(self.prog)));
  });

  _dig();

  let retryTimes = 0;
  function _dig() {
    self.prog.loaded = 0;
    self.aliOSS
      .putStream(self.to.key, readStream, {
        mime: mime.lookup(self.from.path),
        contentLength: total,
      })
      .then(() => {
        self._changeStatus("verifying");
        self._changeStatus("finished");
        self.emit("complete");
        console.log(
          "upload: " + self.from.path + " %celapse",
          "background:green;color:white",
          self.endTime - self.startTime,
          "ms"
        );
      })
      .catch((err) => {
        if (
          err.message.indexOf("Access denied") != -1 ||
          err.message.indexOf("You have no right to access") != -1 ||
          readStream.destroyed ||
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
      });
  }
};

/**
 * 分块上传
 * @param checkPoints
 */
UploadJob.prototype.uploadMultipart = function (checkPoints) {
  const self = this;

  const maxRetries = RETRYTIMES;

  const retries = {}; //重试次数 [partNumber]
  let concurrency = 0; //并发块数

  const uploadNumArr = util.genUploadNumArr(checkPoints);
  if (isDebug)
    console.log("upload part nums:", uploadNumArr.join(","), self.from.path);

  if (isLog == 1 && isLogInfo == 1) {
    log.transports.file.level = "info";
    log.info(`upload part nums: ${uploadNumArr.join(",")} ${self.from.path}`);
  }

  self.prog.total = checkPoints.file.size;

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

  util.getUploadId(
    checkPoints,
    self,
    { mime: mime.lookup(self.from.path) },
    function (err, uploadId) {
      if (isDebug) console.info("Got upload ID", err, uploadId, self.from.path);

      if (isLog == 1 && isLogInfo == 1) {
        log.transports.file.level = "info";
        log.info(`Got upload ID: ${err} ${uploadId} ${self.from.path}`);
      }

      if (err) {
        console.error("can not get uploadId:", err);
        self.message = err.message;
        self._changeStatus("failed");
        self.emit("error", err);
        return;
      }

      fs.open(checkPoints.file.path, "r", function (err, fd) {
        fs.closeSync(fd);
        if (err) {
          console.error("can not open file", checkPoints.file.path, err);
          self.message = err.message;
          self._changeStatus("failed");
          self.emit("error", err);
          return;
        }
        var progressInfo = util.getPartProgress(checkPoints);

        self.emit(
          "partcomplete",
          progressInfo,
          JSON.parse(JSON.stringify(checkPoints))
        );

        if (progressInfo.done == progressInfo.total) {
          complete();
        } else {
          if (
            concurrency < self.maxConcurrency &&
            uploadNumArr.length > 0 &&
            !self.stopFlag
          ) {
            doUploadPart(uploadNumArr.shift());
          }
        }
      });
    }
  );

  function validFile(p, fn) {
    fs.open(p, "r", function (err, fd) {
      if (err) {
        fn(err);
        return;
      }
      fs.closeSync(fd);
      fn();
    });
  }

  // partNum: 0-n
  function doUploadPart(partNum) {
    if (partNum == null) return;

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
      return;
    }

    concurrency++;

    const { len, start } = checkPoints.chunks[partNum];

    validFile(self.from.path, (err) => {
      if (err) {
        self.message = err.message;
        self._changeStatus("failed");
        self.emit("error", err);
        return;
      }
      doUpload(
        self.to.key,
        checkPoints.uploadId,
        partNum + 1,
        self.from.path,
        start,
        start + len
      );
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
  function doUpload(name, uploadId, partNo, file, start, end, options) {
    console.log("doUpload: ", name, uploadId, partNo);
    self._log_opt[partNo] = {
      start: Date.now(),
    };

    if (self.stopFlag) {
      return;
    }

    checkPoints.Parts[partNo] = {
      PartNumber: partNo,
      loaded: 0,
    };

    self.aliOSS
      .uploadPart(name, uploadId, partNo, file, start, end, options)
      .then((data) => {
        if (self.stopFlag) return;

        checkPoints.Parts[partNo].ETag = data.etag;
        checkPoints.Parts[partNo].loaded = end - start;

        updateProgress();

        concurrency--;

        self._log_opt[partNo].end = Date.now();

        updateSpeedCounter();

        const progressInfo = util.getPartProgress(checkPoints);
        self.emit(
          "partcomplete",
          progressInfo,
          JSON.parse(JSON.stringify(checkPoints))
        );

        if (progressInfo.done == progressInfo.total) {
          //util.closeFD(keepFd);
          if (isDebug) util.printPartTimeLine(self._log_opt);

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
      })
      .catch((err) => {
        console.log(err.stack);
        checkPoints.Parts[partNo].ETag = null;
        checkPoints.Parts[partNo].loaded = 0;

        if (err.code == "RequestAbortedError") {
          //用户取消
          console.warn("用户取消");
          return;
        }

        console.warn(
          "multiErr, upload part error:",
          err.message || err,
          name,
          uploadId,
          partNo,
          file,
          start,
          end,
          options
        );

        if (retries[partNo] >= maxRetries) {
          self.message = "上传分片失败: #" + partNo;
          self.stop();
          concurrency--;
        } else if (
          err.message.indexOf("The specified upload does not exist") != -1
        ) {
          self.message = "上传分片失败: #" + partNo;
          self._changeStatus("failed");
          self.emit("error", err);
          concurrency--;
        } else {
          retries[partNo]++;
          // 分片重试次数
          self._changeStatus("retrying", retries[partNo]);
          console.warn(
            "将要重新上传分片: #",
            partNo,
            ", 还可以重试" + (maxRetries - retries[partNo]) + "次"
          );
          setTimeout(function () {
            console.warn("重新上传分片: #", partNo);
            doUpload(name, uploadId, partNo, file, start, end, options);
          }, 2000);
        }
        return;
      });

    function updateProgress() {
      let loaded = 0;
      for (let k in checkPoints.Parts) {
        loaded += checkPoints.Parts[k].loaded;
      }
      self.prog.loaded = loaded;
      self.emit("progress", self.prog);
    }
  }

  // uploadPart未支持传stream时临时测速,由于并发上传,speed会随着时间推移且并发数足够多时趋近真实情况
  const speedTimerStart = Date.now();
  function updateSpeedCounter() {
    self.lastSpeed = 0;

    if (self.stopFlag) {
      self.speed = 0;
      self.predictLeftTime = 0;
      return;
    }

    const duration = Math.ceil((Date.now() - speedTimerStart) / 1000);
    self.speed = Number(self.prog.loaded / duration).toFixed(2);
    if (self.lastSpeed != self.speed) self.emit("speedChange", self.speed);
    self.lastSpeed = self.speed;

    //推测耗时
    self.predictLeftTime =
      self.speed == 0
        ? 0
        : Math.floor((self.prog.total - self.prog.loaded) / self.speed) * 1000;

    //根据speed 动态调整 maxConcurrency, 每个分片下载完成后修改一次
    self.maxConcurrency = util.computeMaxConcurrency(
      self.speed,
      self.checkPoints.chunkSize,
      self.maxConcurrency
    );
    if (isDebug)
      console.info("set max concurrency:", self.maxConcurrency, self.from.path);

    if (isLog == 1 && isLogInfo == 1) {
      log.transports.file.level = "info";
      log.info(`set max concurrency: ${self.maxConcurrency} ${self.from.path}`);
    }
  }

  function complete() {
    console.info("Completing upload..., uploadId: ", checkPoints.uploadId);

    //防止多次complete
    if (self._hasCallComplete) {
      //console.log('多次提交')
      return;
    }
    self._hasCallComplete = true;

    const parts = [];
    for (let k in checkPoints.Parts) {
      const i = checkPoints.Parts[k];
      parts.push({
        number: i.PartNumber,
        etag: i.ETag,
      });
    }
    const doneParams = {
      name: self.to.key,
      parts: parts.sort(function (a, b) {
        return a.number - b.number;
      }),
      uploadId: checkPoints.uploadId,
      options: undefined,
    };

    // console.log('4444444', doneParams)
    //
    // if(!self._mm) self._mm={};
    // if(!self._mm[doneParams.UploadId]) self._mm[doneParams.UploadId]=1;
    // else console.error(doneParams.UploadId, '已经complete过一次了');
    //
    console.log("-->completeMultipartUpload sending...", doneParams.uploadId);
    console.time("completeMultipartUpload:" + doneParams.uploadId);
    util.completeMultipartUpload(self, doneParams, function (err, data) {
      console.timeEnd("completeMultipartUpload:" + doneParams.uploadId);
      console.log(
        "[completeMultipartUpload] returns:",
        err,
        JSON.stringify(data)
      );
      if (err) {
        console.error("[" + doneParams.uploadId + "]", err, doneParams);
        self.message = err.message;
        self._changeStatus("failed");
        self.emit("error", err);
      } else {
        self._changeStatus("verifying");
        // util.checkFileHash(
        //   self.from.path,
        //   data["HashCrc64ecma"],
        //   data["ContentMD5"],
        //   function (err) {
        //     if (err) {
        //       self.message = err.message || err;
        //       console.error(self.message, self.to.path);
        //       self._changeStatus("failed");
        //       self.emit("error", err);
        //       self.deleteOssFile();
        //     } else {
        checkPoints.done = true;
        self._changeStatus("finished");
        self.emit("complete");
        console.log(
          "upload: " + self.from.path + " %celapse",
          "background:green;color:white",
          self.endTime - self.startTime,
          "ms"
        );
        //       }
        //     }
        //   );
      }
    });
  }
};

module.exports = UploadJob;

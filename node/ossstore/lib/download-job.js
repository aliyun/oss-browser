"use strict";

var Base = require("./base");
var fs = require("fs");
// var path = require('path');
var util = require("./download-job-util");
// var isDebug = process.env.NODE_ENV == 'development';
var commonUtil = require("./util");
var RETRYTIMES = commonUtil.getRetryTimes();
// var fdSlicer = require('fd-slicer');
var stream = require("stream");
const DataCache = require("./DataCache");

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
    this.id =
      "dj-" + new Date().getTime() + "-" + ("" + Math.random()).substring(2);
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

    this.from = util.parseOssPath(this._config.from); //oss path
    this.to = util.parseLocalPath(this._config.to); //local path
    this.region = this._config.region;
    this.hashCrc64ecma = this._config.hashCrc64ecma;

    this.prog = this._config.prog || {
      loaded: 0,
      total: 0,
    };

    this.message = this._config.message;
    this.status = this._config.status || "waiting";

    this.stopFlag = this.status != "running";

    this.checkPoints = this._config.checkPoints;
    this.enableCrc64 = this._config.enableCrc64;

    //console.log('created download job');

    this.maxConcurrency = parseInt(
      localStorage.getItem("downloadConcurrecyPartSize") || 5
    );

    this.crc64Promise = [];

    // 正在写文件状态
    this.writing = false;
  }
}

DownloadJob.prototype.start = function () {
  var self = this;
  if (this.status == "running") return;

  if (this._lastStatusFailed) {
    //从头开始
    this.checkPoints = {};
    this.crc64Promise = [];
    this.writing = false;
  }

  self.message = "";
  self.startTime = new Date().getTime();
  self.endTime = null;

  self.stopFlag = false;
  self._changeStatus("running");

  self.checkPoints =
    self.checkPoints && self.checkPoints.Parts
      ? self.checkPoints
      : {
          from: self.from,
          to: self.to,
          Parts: {},
        };

  self.startDownload(self.checkPoints);

  return self;
};

/**
 * 开始download
 */
DownloadJob.prototype.startDownload = async function (checkPoints) {
  var self = this;

  self._log_opt = {};

  var chunkNum = 0;
  var chunkSize = 0;
  //var keepFd;
  var chunks = [];

  var maxRetries = RETRYTIMES;

  var concurrency = 0;

  var tmpName = self.to.path + ".download";
  var fileMd5 = "";
  var hashCrc64ecma = "";
  self.dataCache = new DataCache();

  var objOpt = {
    Bucket: self.from.bucket,
    Key: self.from.key,
  };
  this.aliOSS.useBucket(self.from.bucket);
  let headers;
  try {
    headers = await util.headObject(self, objOpt);
  } catch (err) {
    if (
      err.message.indexOf("Network Failure") != -1 ||
      err.message.indexOf("getaddrinfo ENOTFOUND") != -1
    ) {
      self.message = "failed to get oss object meta: " + err.message;
      console.error(self.message, self.to.path);
      self.stop();
      //self.emit('error', err);
    } else {
      self.message = "failed to get oss object meta: " + err.message;
      console.error(self.message, self.to.path);
      self._changeStatus("failed");
      self.emit("error", err);
    }
    return;
  }

  // fileMd5 = headers['content-md5'];//.replace(/(^\"*)|(\"*$)/g, '');
  //console.log('file md5:',fileMd5);
  hashCrc64ecma = headers["x-oss-hash-crc64ecma"];
  if (self.hashCrc64ecma && self.hashCrc64ecma !== hashCrc64ecma) {
    // 做下判断，防止原始文件发生变更
    self.message = "文件已经发生变更，请重新下载该文件";
    console.error(self.message, self.to.path);
    self._changeStatus("failed");
    return false;
  }
  self.hashCrc64ecma = hashCrc64ecma;

  const contentLength = parseInt(headers["content-length"]);
  self.prog.total = contentLength;
  //空文件
  if (self.prog.total == 0) {
    fs.writeFile(self.to.path, "", function (err) {
      if (err) {
        self.message = "failed to open local file:" + err.message;
        //console.error(self.message);
        console.error(self.message, self.to.path);
        self._changeStatus("failed");
        self.emit("error", err);
      } else {
        self._changeStatus("finished");
        self.emit("progress", {
          total: 0,
          loaded: 0,
        });
        self.emit("partcomplete", {
          total: 0,
          done: 0,
        });
        self.emit("complete");
        console.log(
          "download: " + self.to.path + " %celapse",
          "background:green;color:white",
          self.endTime - self.startTime,
          "ms"
        );
      }
    });
    return;
  }

  if (self.stopFlag) {
    return;
  }

  chunkSize =
    checkPoints.chunkSize ||
    self._config.chunkSize ||
    util.getSensibleChunkSize(self.prog.total);
  chunkNum = Math.ceil(self.prog.total / chunkSize);
  const divisible = self.prog.total % chunkSize === 0;

  chunks = [];

  let p = 0;
  for (var i = 0; i < chunkNum; i++) {
    if (!checkPoints.Parts[i + 1] || !checkPoints.Parts[i + 1].done) {
      chunks.push(i);
      let size = chunkSize;
      if (chunkNum === 1 || divisible) {
        size = chunkSize;
      } else if (i + 1 === chunkNum) {
        size = self.prog.total % chunkSize;
      }
      checkPoints.Parts[i + 1] = {
        PartNumber: i + 1, // 分片序号
        loaded: 0, // 该分片已经写盘长度
        size: size, // 该分片需要写盘的长度，用于判断分片是否完成
        done: false, // 该分片是否已经下载并完成写盘
        position: p, // 该分片中下一个 data 需要写入文件中的位置
        crc64: "", // 该分片中 crc64 值
      };
    }
    p += chunkSize;
  }

  //之前每个part都已经全部下载完成，状态还没改成完成的, 这种情况出现几率极少。
  if (self.prog.loaded === self.prog.total) {
    self._calProgress(checkPoints);
    self._changeStatus("verifying");
    await self._complete(tmpName, hashCrc64ecma, checkPoints);
    return;
  }

  try {
    util.createFileIfNotExists(tmpName);
  } catch (err) {
    self.message = "failed to open local file:" + err.message;
    console.error(self.message, self.to.path);
    self._changeStatus("failed");
    self.emit("error", err);
    return;
  }
  if (self.stopFlag) {
    return;
  }
  const fd = fs.openSync(tmpName, "r+");
  self.fd = fd;

  util.getFreeDiskSize(tmpName, function (err, freeDiskSize) {
    console.log(
      "got free disk size:",
      freeDiskSize,
      contentLength,
      freeDiskSize - contentLength
    );
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

    const partNumber = n + 1;
    if (checkPoints.Parts[partNumber].done) {
      console.log(`part [${n}] has finished`);
      return;
    }

    var start = chunkSize * n;
    var end = n + 1 < chunkNum ? start + chunkSize : self.prog.total;

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

      // self._log_opt[partNumber] = {
      //   start: Date.now()
      // };
      const part = checkPoints.Parts[partNumber];
      console.log(part, "part download");
      // 保留原始分片信息，出错后进行重置
      const originPart = Object.assign({}, part);

      self.aliOSS
        .getStream(objOpt.Key, {
          headers: {
            Range: `bytes=${start}-${end - 1}`,
          },
        })
        .then((res) => {
          if (self.stopFlag) {
            return;
          }
          let dataSize = 0;
          res.stream
            .on("data", function (chunk) {
              if (self.stopFlag) {
                res.stream.destroy();
                return;
              }
              dataSize += chunk.length;
              // 用来计算下载速度
              self.downloaded = (self.downloaded || 0) + chunk.length;
              self.dataCache.push(partNumber, chunk);
              writePartData();
            })
            .on("end", async function () {
              if (
                (dataSize !== part.size || !res.stream.complete) &&
                !self.stopFlag
              ) {
                const message = "重新下载: download size != part size";
                console.error(message, "part");
                const err = new Error();
                err.message = message;
                _handleError(err, partNumber);
                return;
              }
              downloadPartByMemoryLimit();
            })
            .on("error", (e) => _handleError(e, partNumber));
          self._calPartCRC64Stream(res.stream, partNumber);
        })
        .catch((e) => _handleError(e, partNumber));

      function downloadPartByMemoryLimit() {
        if (self.stopFlag) {
          return;
        }
        // 网络下载快于磁盘读写，sleep 防止内存占用过大
        if (hasNextPart(chunks)) {
          if (
            self.dataCache.size() < self.maxConcurrency &&
            concurrency <= self.maxConcurrency
          ) {
            downloadPart(getNextPart(chunks));
          } else {
            setTimeout(() => {
              downloadPartByMemoryLimit();
            }, 1000);
          }
        }
      }

      async function writePartData() {
        const { writing, checkPoints } = self;
        // 保证只有一个写操作
        if (writing) {
          return false;
        }
        const dataInfo = self.dataCache.shift();
        if (!dataInfo) {
          return;
        }
        const { partNumber, data, length } = dataInfo;
        const part = checkPoints.Parts[partNumber];
        self.writing = true;
        fs.write(self.fd, data, 0, length, part.position, function (
          err,
          bytesWritten
        ) {
          self.writing = false;
          if (err) {
            console.error(err, "err");
            self.message = "文件写入失败, 重新尝试下载: " + err.message;
            self.stop();
            return false;
          }
          if (bytesWritten !== length) {
            const err = new Error();
            err.message = "文件写入长度不一致";
            console.error("文件写入长度不一致，重新下载");
            _handleError(err, partNumber);
            return false;
          }
          part.loaded += length;
          part.position += length;
          if (part.loaded > part.size) {
            console.error(part.loaded, part.size);
            part.done = false;
            self.message = "文件写入长度大于实际长度，重新下载";
            self.stop();
            return false;
          }
          if (part.loaded === part.size) {
            part.done = true;
            concurrency--;
          } else {
            part.done = false;
          }
          self._calProgress(checkPoints);
          if (self.prog.loaded === self.prog.total) {
            //  下载完成
            self._changeStatus("verifying");
            // 确保所有crc64已经校验完成
            self._complete(tmpName, hashCrc64ecma, checkPoints);
          } else {
            writePartData();
          }
        });
      }

      function _handleError(err, partNumber) {
        console.error("download error", err);
        // 重置原始状态
        checkPoints.Parts[partNumber] = originPart;
        self.dataCache.cleanPart(partNumber);
        // TODO code 状态码修复
        if (err.code == "RequestAbortedError") {
          // 必须用callback 而不是 promise 方式才能 abort 请求;
          //用户取消
          console.warn("用户取消");
          return;
        }

        if (retryCount >= maxRetries) {
          self.message = `failed to download part [${partNumber}]: ${err.message}`;
          //console.error(self.message);
          console.error(self.message, self.to.path);
          //self._changeStatus('failed');
          self.stop();
          //self.emit('error', err);
          //util.closeFD(keepFd);
        } else if (err.code == "InvalidObjectState") {
          self.message = `failed to download part [${partNumber}]: ${err.message}`;
          //console.error(self.message);
          console.error(self.message, self.to.path);
          self._changeStatus("failed");
          self.emit("error", err);
          //util.closeFD(keepFd);
        } else {
          retryCount++;
          console.log(
            `retry download part [${partNumber}] error:${err}, ${self.to.path}`
          );
          setTimeout(function () {
            doDownload(partNumber - 1);
          }, 2000);
        }
      }
    }
  }
};

/**
 * 异步计算分片crc64
 * @param s
 * @private
 */
DownloadJob.prototype._calPartCRC64Stream = function (s, partNumber) {
  const streamCpy = s.pipe(new stream.PassThrough());
  const self = this;
  const start = new Date();
  const checkPoints = self.checkPoints;
  const part = checkPoints.Parts[partNumber];
  const res = util
    .getStreamCrc64(streamCpy)
    .then((data) => {
      part.crc64 = data;
      try {
        const list = Object.keys(checkPoints.Parts)
          .sort((a, b) => +a - +b)
          .map((key) => checkPoints.Parts[key])
          .filter((item) => item.crc64)
          .map((item) => ({
            crc64: item.crc64,
            len: item.size,
            partNumber: item.PartNumber,
          }));
        console.log(
          `part [${partNumber}] crc64 finish use: '${
            +new Date() - start
          } ms, crc64 is ${data}`,
          list
        );
      } catch (e) {
        console.error(e);
      }
    })
    .catch((err) => {
      self.message = "分片校验失败";
      part.loaded = 0;
      part.done = false;
      part.crc64 = "";
      console.error(self.message, self.to.path, err);
      self.stop();
      self._changeStatus("failed");
      self.emit("error", err);
    });
  if (self.stopFlag) {
    return;
  }
  self.crc64Promise.push(res);
  return res;
};

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
  this.emit("progress", this.prog);
};

/**
 * 完成文件下载及校验
 * @param tmpName
 * @param hashCrc64ecma
 * @param checkPoints
 * @returns {Promise<void>}
 * @private
 */
DownloadJob.prototype._complete = async function (
  tmpName,
  hashCrc64ecma,
  checkPoints
) {
  // 确保所有crc64已经校验完成
  const start = new Date();
  const self = this;

  try {
    if (!self.dataCache.isEmpty()) {
      const err = new Error();
      console.error("download finished: ", self.dataCache);
      err.message = "文件下载错误：has data cache";
      throw err;
    }

    await Promise.all(self.crc64Promise);
    const crc64List = this._getCRC64List(checkPoints);
    const res = await util.combineCrc64(crc64List);
    console.log("combine crc64  use: " + (+new Date() - start) + "ms");
    const stats = fs.statSync(tmpName);
    const fileSize = stats.size;
    if (res === hashCrc64ecma) {
      //临时文件重命名为正式文件
      if (fileSize === self.prog.total) {
        try {
          fs.renameSync(tmpName, self.to.path);
        } catch (err) {
          if (fileSize === self.prog.total) {
            // 文件已经下载完, 长度也正确，没必要重新下载，暂停即可
            console.error("rename error", err);
            self.message = "文件重名失败: " + err.message;
            self.stop();
            return;
          } else {
            // 其他错误，重新下载文件
            err.message = "文件重命名失败";
            throw err;
          }
        }
      } else {
        // 文件长度不对，需要重新下载
        const err = new Error();
        err.message = "文件长度错误，请重新下载";
        throw err;
      }
      self._changeStatus("finished");
      //self.emit('progress', progCp);
      self.emit(
        "partcomplete",
        util.getPartProgress(checkPoints.Parts),
        checkPoints
      );
      self.emit("complete");
      util.closeFD(self.fd);
      console.log(
        "download: " + self.to.path + " %celapse",
        "background:green;color:white",
        self.endTime - self.startTime,
        "ms"
      );
    } else {
      const error = new Error();
      error.message = "文件校验不匹配，请删除文件重新下载";
      throw error;
    }
  } catch (err) {
    self.message = err.message || err;
    console.error(self.message, self.to.path, checkPoints);
    self._changeStatus("failed");
    util.deleteFileIfExists(tmpName);
    self.emit("error", err);
  }
};

DownloadJob.prototype.stop = function () {
  var self = this;
  if (self.status == "stopped") return;
  self.stopFlag = true;
  self._changeStatus("stopped");
  self.speed = 0;
  self.predictLeftTime = 0;
  // 清空 cache
  self.dataCache = new DataCache();
  return self;
};

DownloadJob.prototype.wait = function () {
  var self = this;
  if (this.status == "waiting") return;
  this._lastStatusFailed = this.status == "failed";
  self.stopFlag = true;
  self._changeStatus("waiting");
  return self;
};

DownloadJob.prototype._changeStatus = function (status, retryTimes) {
  var self = this;
  self.status = status;
  self.emit("statuschange", self.status, retryTimes);

  if (status == "failed" || status == "stopped" || status == "finished") {
    self.endTime = new Date().getTime();
    //util.closeFD(self.keepFd);

    console.log("clear speed tid, status:", self.status);
    clearInterval(self.speedTid);
    self.speed = 0;
    //推测耗时
    self.predictLeftTime = 0;
  }
};

DownloadJob.prototype.startSpeedCounter = function () {
  const self = this;

  self.lastLoaded = self.downloaded || 0;
  self.lastSpeed = 0;

  // 防止速度计算发生抖动，
  self.speeds = [];
  let tick = 0;
  clearInterval(self.speedTid);
  self.speedTid = setInterval(function () {
    if (self.stopFlag) {
      self.speed = 0;
      self.speeds = [];
      self.predictLeftTime = 0;
      return;
    }

    self.speed = self.downloaded - self.lastLoaded;
    self.speeds[tick] = self.speed;
    const speedsAll = self.speeds.filter((i) => typeof i === "number");
    let speedAvg = 0;
    if (speedsAll.length !== 0) {
      speedAvg = speedsAll.reduce((acc, cur) => acc + cur) / speedsAll.length;
    }
    if (self.lastSpeed != speedAvg) self.emit("speedChange", speedAvg);
    self.lastSpeed = speedAvg;
    self.lastLoaded = self.downloaded;

    //推测耗时
    self.predictLeftTime =
      speedAvg == 0
        ? 0
        : Math.floor(((self.prog.total - self.prog.loaded) / speedAvg) * 1000);

    //根据speed 动态调整 maxConcurrency, 5秒修改一次
    tick++;
    if (tick > 5) {
      tick = 0;
      self.maxConcurrency = util.computeMaxConcurrency(
        self.speed,
        self.chunkSize,
        self.maxConcurrency
      );
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

DownloadJob.prototype._getCRC64List = function (checkPoints) {
  const parts = Object.keys(checkPoints.Parts)
    .sort((a, b) => +a - +b)
    .map((key) => checkPoints.Parts[key]);
  if (parts.every((item) => item.done)) {
    return parts.map((item) => ({ crc64: item.crc64, len: item.size }));
  } else {
    const err = new Error();
    console.error("文件检验失败，请重新下载", checkPoints);
    err.message = "文件检验失败，请重新下载: get CRC64List error";
    throw err;
  }
};

module.exports = DownloadJob;

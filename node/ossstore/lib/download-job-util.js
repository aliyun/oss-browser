// var fs = require('fs');
// var crypto = require('crypto');
var util = require("./util");
var os = require("os");
var path = require("path");
var cp = require("child_process");
var commonUtil = require("./util");
var RETRYTIMES = commonUtil.getRetryTimes();

module.exports = {
  getSensibleChunkSize: getSensibleChunkSize,

  parseLocalPath: util.parseLocalPath,
  parseOssPath: util.parseOssPath,

  headObject: headObject,
  computeMaxConcurrency: computeMaxConcurrency,
  // checkFileHash : util.checkFileHash,

  getPartProgress: getPartProgress,

  getFreeDiskSize: getFreeDiskSize,
  printPartTimeLine: util.printPartTimeLine,

  closeFD: util.closeFD,
  deleteFileIfExists: util.deleteFileIfExists,
  getBufferCrc64: (buffer) => {
    return new Promise((resolve, reject) => {
      try {
        util.getBufferCrc64(buffer, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } catch (e) {
        console.error("crc64 function error");
        var error = new Error();
        error.message = "CRC64模块加载失败";
        reject(error);
      }
    });
  },
  getStreamCrc64: (s) => {
    return new Promise((resolve, reject) => {
      try {
        util.getStreamCrc64(s, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } catch (e) {
        console.error("crc64 function error");
        const error = new Error();
        error.message = "CRC64模块加载失败";
        reject(error);
      }
    });
  },
  combineCrc64: async (list) => {
    console.log("begin combine crc64", list);
    let str = "";
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (i === 0) {
        str = item.crc64;
      } else {
        str = await new Promise((resolve, reject) => {
          util.combileCrc64(str, item.crc64, item.len, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      }
    }
    return str;
  },
  createFileIfNotExists: util.createFileIfNotExists,
};

function getFreeDiskSize(p, fn) {
  var stats = fs.statSync(p);
  var fileSize = stats.size;

  if (os.platform() == "win32") {
    //windows

    try {
      var driver = path.parse(p).root.substring(0, 2);
    } catch (e) {
      fn(new Error("Failed to get free disk size, path=" + p));
    }

    cp.exec(driver + " && cd / && dir", function (err, stdout, stderr) {
      var num;
      try {
        var arr = stdout.trim().split("\n");
        var lastLine = arr.slice(arr.length - 1);
        lastLine = (lastLine + "").trim();

        num = lastLine.match(/\s+([\d,]+)\s+/)[1];
        num = parseInt(num.replace(/,/g, ""));
      } catch (e) {}
      if (num != null) fn(null, num + fileSize);
      else fn(new Error("Failed to get free disk size, path=" + p));
    });
  } else {
    //linux or mac
    cp.exec("df -hl", function (err, stdout, stderr) {
      var size;
      try {
        var arr = stdout.trim().split("\n");
        arr.splice(0, 1);

        var t = [];
        for (var n of arr) {
          var arr2 = n.split(/\s+/);
          t.push({
            pre: arr2[arr2.length - 1],
            freeSize: arr2[3],
            deep: arr2[arr2.length - 1].split("/").length,
          });
        }

        t.sort((a, b) => {
          if (a.deep < b.deep) return 1;
          else return -1;
        });

        for (var n of t) {
          if (p.startsWith(n.pre)) {
            size = parseSize(n.freeSize);
            break;
          }
        }
      } catch (e) {}

      if (size != null) fn(null, size + fileSize);
      else fn(new Error("Failed to get free disk size, path=" + p));
    });
  }
}
function parseSize(s) {
  var arr = s.match(/([\d.]+)(\D?).*/);
  return parseFloat(arr[1]) * parseSizeUnit(arr[2]);
}
function parseSizeUnit(g) {
  switch (g.toLowerCase()) {
    default:
      return 1;
    case "k":
      return 1024;
    case "m":
      return Math.pow(1024, 2);
    case "g":
      return Math.pow(1024, 3);
    case "t":
      return Math.pow(1024, 4);
    case "p":
      return Math.pow(1024, 5);
  }
}
function getPartProgress(parts) {
  var c = 0;
  var len = 0;
  for (var k in parts) {
    len++;
    if (parts[k].done) c++;
  }
  return {
    done: c,
    total: len,
  };
}

function headObject(self, objOpt) {
  return new Promise((resolve, reject) => {
    let retryTimes = 0;
    _dig();

    function _dig() {
      self.aliOSS
        .head(objOpt.Key)
        .then((data) => {
          resolve(data.res.headers);
        })
        .catch((err) => {
          // TODO code 需要更改, Forbidden 是什么状态？？
          if (err.code == "Forbidden") {
            err.message = "Forbidden";
            reject(err);
            return;
          }
          if (retryTimes > RETRYTIMES) {
            reject(err);
          } else {
            retryTimes++;
            self._changeStatus("retrying", retryTimes);
            console.warn(
              "headObject error",
              err,
              ", ----- retrying...",
              `${retryTimes}/${RETRYTIMES}`
            );
            setTimeout(function () {
              if (!self.stopFlag) _dig();
            }, 2000);
          }
        });
    }
  });
}

function getSensibleChunkSize(size) {
  console.warn(
    `localStorage uploadPartSize: " ${
      localStorage.getItem("uploadPartSize") || 10
    }M`
  );

  var chunkSize =
    parseInt(localStorage.getItem("uploadPartSize") || 10) * 1024 * 1024;

  if (size < chunkSize) {
    return size;
  }

  var c = Math.ceil(size / 10000);
  return Math.max(c, chunkSize);
  // var chunkSize = 5 * 1024 * 1024; //5MB
  //
  // if(size < chunkSize){
  //   return size;
  // }
  // else if(size < 100 * 1024*1024){
  //   chunkSize = 10 * 1024 * 1024; //10MB
  // }
  // else if(size < 500 * 1024*1024){
  //   chunkSize = 20 * 1024 * 1024; //20MB
  // }
  // else if(size < 1024 * 1024*1024){
  //   chunkSize = 30 * 1024 * 1024; //30MB
  // }
  // else if(size < 5* 1024 * 1024*1024){
  //   chunkSize = 40 * 1024 * 1024; //40MB
  // }
  // else{
  //   chunkSize = 50 * 1024 * 1024; //50MB
  // }
  //
  // var c = Math.ceil(size/9000);
  // return Math.max(c, chunkSize);
}

//根据网速调整下载并发量
function computeMaxConcurrency(speed, chunkSize, lastConcurrency) {
  var downloadConcurrecyPartSize = parseInt(
    localStorage.getItem("downloadConcurrecyPartSize") || 5
  );
  return downloadConcurrecyPartSize;
}

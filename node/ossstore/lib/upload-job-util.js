"use strict";

var fs = require("fs");
var path = require("path");
var util = require("./util");
var commonUtil = require("./util");
var RETRYTIMES = commonUtil.getRetryTimes();

module.exports = {
  genUploadNumArr: genUploadNumArr,
  prepareChunks: prepareChunks,
  getSensibleChunkSize: getSensibleChunkSize,
  parseLocalPath: util.parseLocalPath,
  parseOssPath: util.parseOssPath,

  getPartProgress: getPartProgress,
  checkAllPartCompleted: checkAllPartCompleted,

  getUploadId: getUploadId,
  completeMultipartUpload: completeMultipartUpload,

  computeMaxConcurrency: computeMaxConcurrency,

  checkFileHash: util.checkFileHash,
  printPartTimeLine: util.printPartTimeLine,
};

/*************************************
 //  以下是纯函数
 ************************************/

// function getFileCrc64_2(self, p, fn) {
//   if (self.crc64Str) {
//     fn(null, self.crc64Str);
//     return;
//   }
//   var retryTimes = 0;
//   _dig();
//   function _dig() {
//     util.getFileCrc64(p, function (err, data) {
//       if (err) {
//         if (retryTimes > RETRYTIMES) {
//           fn(err);
//         } else {
//           retryTimes++;
//           setTimeout(function () {
//             if (!self.stopFlag) _dig();
//           }, 1000);
//         }
//       } else {
//         fn(null, data);
//       }
//     });
//   }
// }

function getPartProgress(checkPoints) {
  var total = checkPoints.chunks.length;
  var c = 0;
  for (var k in checkPoints.Parts) {
    if (checkPoints.Parts[k].ETag) c++;
  }

  return {
    done: c,
    total: total,
  };
}

function checkAllPartCompleted(checkPoints) {
  var prog = getPartProgress(checkPoints);
  return prog.done == prog.total;
}

function completeMultipartUpload(self, doneParams, fn) {
  var retryTimes = 0;
  setTimeout(_dig, 10);
  function _dig() {
    self.aliOSS
      .completeMultipartUpload(
        doneParams.name,
        doneParams.uploadId,
        doneParams.parts,
        doneParams.options
      )
      .then((data) => {
        fn(null, data);
      })
      .catch((err) => {
        if (err.message.indexOf("The specified upload does not exist") != -1) {
          self.aliOSS
            .head(self.to.key)
            .then((data2) => {
              fn(null, data2);
            })
            .catch((err2) => {
              fn(err2);
            });
          return;
        }

        if (retryTimes > RETRYTIMES) {
          fn(err);
        } else {
          retryTimes++;
          self._changeStatus("retrying", retryTimes);
          console.error(
            "completeMultipartUpload error",
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
}

function getUploadId(checkPoints, self, params, fn) {
  if (checkPoints.uploadId) {
    fn(null, checkPoints.uploadId);
    return;
  }

  let retryTimes = 0;
  _dig();
  function _dig() {
    self.aliOSS
      .initMultipartUpload(self.to.key, params)
      .then((res) => {
        checkPoints.uploadId = res.uploadId;
        fn(null, res.uploadId);
      })
      .catch((err) => {
        if (
          err.message.indexOf("You have no right to access") != -1 ||
          retryTimes > RETRYTIMES
        ) {
          fn(err);
        } else {
          retryTimes++;
          self._changeStatus("retrying", retryTimes);
          console.warn(
            "createMultipartUpload error",
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
}

function genUploadNumArr(result) {
  var parts = result.Parts;
  var chunkNum = result.chunks.length;

  var mDone = {};
  var mHas = {};
  if (parts) {
    for (var k in parts) {
      if (parts[k].ETag) {
        mDone[k] = parts[k].ETag;
      }
      mHas[k] = parts[k];
    }
  }

  var t = [];
  for (var i = 0; i < chunkNum; i++) {
    if (!mDone[i + 1 + ""]) {
      t.push(i);
    }

    if (!mHas[i + 1 + ""]) {
      parts[i + 1 + ""] = {
        PartNumber: i + 1,
        loaded: 0,
      };
    }
  }
  return t;
}

function prepareChunks(filePath, checkPoints, fn) {
  checkPoints = checkPoints || {};

  var fileName = path.basename(filePath);

  fs.stat(filePath, function (err, state) {
    if (err) {
      fn(err);
      return;
    }

    var chunkSize = checkPoints.chunkSize || getSensibleChunkSize(state.size);
    var chunkNum =
      state.size > chunkSize ? Math.ceil(state.size / chunkSize) : 1;

    //console.log('chunkSize: ', chunkSize, "chunkNum: ", chunkNum);

    var chunks = [];

    for (var i = 0; i < chunkNum; i++) {
      var start = i * chunkSize;
      chunks[i] = {
        start: start,
        len: i + 1 == chunkNum ? state.size - start : chunkSize,
      };
    }

    fn(null, {
      chunks: chunks,
      chunkSize: chunkSize,
      Parts: checkPoints.Parts || {},
      uploadId: checkPoints.uploadId || null,
      file: {
        name: fileName,
        size: state.size,
        path: filePath,
      },
    });
  });
}

/**
 * @param total size
 */
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
}

//根据网速调整上传并发量
function computeMaxConcurrency(speed, chunkSize, lastConcurrency) {
  lastConcurrency = lastConcurrency || 5;
  if (speed > chunkSize * lastConcurrency * 0.9) {
    return lastConcurrency + 5;
  } else {
    if (lastConcurrency > 5) return lastConcurrency - 3;
    return 5;
  }
}

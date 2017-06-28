'use strict';


var fs = require('fs');
var path = require('path');
var util = require('./util');

module.exports = {
  genUploadNumArr: genUploadNumArr,
  prepareChunks:prepareChunks,
  getSensibleChunkSize: getSensibleChunkSize,
  parseLocalPath: util.parseLocalPath,
  parseOssPath: util.parseOssPath,

  getPartProgress: getPartProgress,
  checkAllPartCompleted: checkAllPartCompleted,
  closeFD: util.closeFD,
  getUploadId: getUploadId,
  getFileCrc64: getFileCrc64
};

function getFileCrc64(p, fn){
  util.getFileCrc64(p,fn);
};

/*************************************
 //  以下是纯函数
 ************************************/

function getPartProgress(checkPoints){
  var total = checkPoints.chunks.length;
  var c=0;
  for(var k in checkPoints.Parts){
    if(checkPoints.Parts[k].ETag) c++;
  }

  return {
    done: c, total: total
  };
}

function checkAllPartCompleted(checkPoints){
  var prog = getPartProgress(checkPoints);
  return prog.done==prog.total;
}



function getUploadId(checkPoints, client, params, fn){

  if(checkPoints.uploadId){
    fn(null, checkPoints.uploadId);
    return;
  }

  client.createMultipartUpload(params, function (err, res) {

    //console.log(err, res, '<========')
    if (err) {
      fn(err);
      return;
    }

    checkPoints.uploadId = res.UploadId;
    fn(err, res.UploadId);
  });
}

function genUploadNumArr(result){
  var parts = result.Parts;
  var chunkNum = result.chunks.length;

  var mDone = {};
  var mHas={};
  if(parts){
    for(var k in parts){
      if(parts[k].ETag) {
        mDone[k] = parts[k].ETag;
      }
      mHas[k]=parts[k];
    }
  }

  var t=[];
  for(var i=0;i<chunkNum;i++){
    if(!mDone[(i+1)+'']){
      t.push(i);
    }

    if(!mHas[(i+1)+'']){
      parts[(i+1)+'']={
        PartNumber: i + 1,
        loaded: 0
      };
    }
  }
  return t;
}



function prepareChunks(filePath, checkPoints, fn){

  checkPoints = checkPoints || {};

  var fileName = path.basename(filePath);

  fs.stat(filePath, function(err, state) {
    if (err) {
      callback(err);
      return;
    }

    var chunkSize = checkPoints.chunkSize  || getSensibleChunkSize(state.size);
    var chunkNum = state.size > chunkSize ? Math.ceil(state.size / chunkSize) : 1;

    //console.log('chunkSize: ', chunkSize, "chunkNum: ", chunkNum);

    var chunks = [];

    for (var i = 0; i < chunkNum; i++) {
      var start = i * chunkSize;
      chunks[i] = {
        start: start,
        len: (i + 1 == chunkNum) ? (state.size - start) : chunkSize
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
        path: filePath
      }
    });

  });
}



/**
 * @param total size
 */
function getSensibleChunkSize(total) {

  var minChunkSize = 5 * 1024 * 1024;  //5MB
  if(total <= minChunkSize){
    return minChunkSize;
  }

  var parts = Math.ceil(total / minChunkSize);
  if (parts > 10000) {
    return Math.ceil(total / 10000);
  }

  return minChunkSize;
}

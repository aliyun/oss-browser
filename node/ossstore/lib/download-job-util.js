var fs = require('fs');
var crypto = require('crypto');
var util = require('./util');



module.exports = {
  getSensibleChunkSize: getSensibleChunkSize,

  parseLocalPath: util.parseLocalPath,
  parseOssPath: util.parseOssPath,

  headObject: headObject,
  computeMaxConcurrency: computeMaxConcurrency,
  checkFileHash : util.checkFileHash,

  getPartProgress: getPartProgress,
};

function getPartProgress(parts){
  var c = 0;
  var len = 0
  for(var k in parts){
    len++;
    if(parts[k].done) c++;
  }
  return {
    done: c, total: len
  }

}

function headObject(self, objOpt, fn){
  var retryTimes = 0;
  _dig();
  function _dig(){
    self.oss.headObject(objOpt, function (err, headers) {

      if (err) {
        if(err.code=='Forbidden'){
          err.message='Forbidden';
          fn(err);
          return;
        }

        if(retryTimes > 10){
          fn(err);
        }else{
          retryTimes++;
          console.warn('headObject error', err, ', ----- retrying...', retryTimes+'/'+10);
          setTimeout(function(){
            if(!self.stopFlag) _dig();
          },2000);
        }
      }
      else{
         fn(null, headers);
      }
    });
  }
}


function getSensibleChunkSize(size) {
  var chunkSize = 5 * 1024 * 1024; //5MB

  if(size < chunkSize){
    return size;
  }
  else if(size < 100 * 1024*1024){
    chunkSize = 10 * 1024 * 1024; //10MB
  }
  else if(size < 500 * 1024*1024){
    chunkSize = 20 * 1024 * 1024; //20MB
  }
  else if(size < 1024 * 1024*1024){
    chunkSize = 30 * 1024 * 1024; //30MB
  }
  else if(size < 5* 1024 * 1024*1024){
    chunkSize = 40 * 1024 * 1024; //40MB
  }
  else{
    chunkSize = 50 * 1024 * 1024; //50MB
  }

  var c = Math.ceil(size/9000);
  return Math.max(c, chunkSize);
}

//根据网速调整下载并发量
function computeMaxConcurrency(speed, chunkSize, lastConcurrency){
  lastConcurrency = lastConcurrency || 5;
  if(speed > chunkSize * lastConcurrency * 0.9){
    return lastConcurrency + 5;

  }else{
    if(lastConcurrency > 5) return lastConcurrency-3;
    return 5;
  }
}

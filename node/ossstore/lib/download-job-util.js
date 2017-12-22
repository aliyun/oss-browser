var fs = require('fs');
var crypto = require('crypto');
var util = require('./util');



module.exports = {
  getSensibleChunkSize: getSensibleChunkSize,

  parseLocalPath: util.parseLocalPath,
  parseOssPath: util.parseOssPath,

  headObject: headObject,
  computeMaxConcurrency: computeMaxConcurrency,
  checkFileHash : util.checkFileHash
};

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

  if(size > 1024*1024*1024){
    chunkSize = 10 * 1024 * 1024; //10MB
  }

  if(size > 20*1024*1024*1024){
    chunkSize = 20 * 1024 * 1024; //20MB
  }

  var c = Math.ceil(size/5000);
  return Math.max(c, chunkSize);
}

//根据网速调整下载并发量
function computeMaxConcurrency(speed, chunkSize){
  if(speed > chunkSize){
    return Math.ceil(speed / chunkSize)+1
  }
  else if(speed > chunkSize/2){
    return 2;
  }else{
    return 1;
  }
  // if(speed > 11*1024*1024) return 13;
  // else if(speed > 8*1024*1024) return 10;
  // else if(speed > 5*1024*1024) return 7;
  // else if(speed > 2*1024*1024) return 5;
  // else if(speed > 1024*1024) return 3;
  // else if(speed > 100*1024) return 2;
  // else return 1;
}

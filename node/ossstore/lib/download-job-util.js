var fs = require('fs');
var crypto = require('crypto');
var util = require('./util');



module.exports = {
  getSensibleChunkSize: getSensibleChunkSize,

  parseLocalPath: util.parseLocalPath,
  parseOssPath: util.parseOssPath,
  getBigFileMd5: getBigFileMd5,
  getFileCrc64: getFileCrc64,

  headObject: headObject,
  computeMaxConcurrency: computeMaxConcurrency
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
function getFileCrc64(p, fn){
  util.getFileCrc64(p,fn);
};

function getBigFileMd5(p, fn){
  util.getBigFileMd5(p, fn)
}

function getSensibleChunkSize(size) {
  var MaxChunkSize = 5 * 1024 * 1024; //5MB

  if(size < MaxChunkSize){
    return size;
  }
  var c = Math.ceil(size/5000);
  return Math.max(c, MaxChunkSize);
}

//根据网速调整下载并发量
function computeMaxConcurrency(speed){
  if(speed > 8*1024*1024) return 10;
  else if(speed > 5*1024*1024) return 7;
  else if(speed > 2*1024*1024) return 5;
  else if(speed > 1024*1024) return 3;
  else if(speed > 100*1024) return 2;
  else return 1;
}

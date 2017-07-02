var fs = require('fs');
var crypto = require('crypto');
var util = require('./util');



module.exports = {
  getSensibleChunkSize: getSensibleChunkSize,
  closeFD: util.closeFD,
  parseLocalPath: util.parseLocalPath,
  parseOssPath: util.parseOssPath,
  getBigFileMd5: getBigFileMd5,
  getFileCrc64: getFileCrc64,

  headObject: headObject
};
function headObject(client, objOpt, fn){
  var retryTimes = 0;
  _dig();
  function _dig(){
    client.headObject(objOpt, function (err, headers) {
      if (err) {
        if(retryTimes > 10){
          fn(err);
        }else{

          retryTimes++;
          console.warn('headObject error', err, ', ----- retrying...', retryTimes+'/'+10);
          setTimeout(function(){
            _dig();
          },2000);
        }
        return;
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
   var md5sum = crypto.createHash('md5');
   var stream = fs.createReadStream(p);
   stream.on('data', function(chunk) {
       md5sum.update(chunk);
   });
   stream.on('end', function() {
     str = md5sum.digest('base64');
     fn(null, str);
   });
   stream.on('error', function(err) {
     fn(err);
   });
}

function getSensibleChunkSize(size) {
  var MaxChunkSize = 5 * 1024 * 1024; //5MB

  if(size < MaxChunkSize){
    return size;
  }
  var c = Math.ceil(size/5000);
  return Math.max(c, MaxChunkSize);
}

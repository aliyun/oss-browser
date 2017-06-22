var fs = require('fs');
var crypto = require('crypto');
var util = require('./util');

try{
  var crc64 = require('../../crc64');
}catch(e){
  console.error(e);
}

module.exports = {
  getSensibleChunkSize: getSensibleChunkSize,
  closeFD: util.closeFD,
  parseLocalPath: util.parseLocalPath,
  parseOssPath: util.parseOssPath,
  getBigFileMd5: getBigFileMd5,
  getFileCrc64: getFileCrc64
};
function getFileCrc64(p, fn){
  if(!crc64){
    console.log('not found crc64 module')
    fn(null, null);
    return;
  }
  crc64.check_stream(fs.createReadStream(p), function(err, data){
    fn(err, data);
  });
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

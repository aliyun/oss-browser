var fs = require('fs');
var crypto = require('crypto');
var util = require('./util');

module.exports = {
  getSensibleChunkSize: getSensibleChunkSize,
  closeFD: util.closeFD,
  parseLocalPath: util.parseLocalPath,
  parseOssPath: util.parseOssPath,
  getBigFileMd5: getBigFileMd5
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

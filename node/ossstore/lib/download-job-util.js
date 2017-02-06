var fs = require('fs');

var util = require('./util');

module.exports = {
  getSensibleChunkSize: getSensibleChunkSize,
  closeFD: util.closeFD,
  parseLocalPath: util.parseLocalPath,
  parseOssPath: util.parseOssPath
};


function getSensibleChunkSize(size) {
  var MaxChunkSize = 5 * 1024 * 1024; //5MB

  if(size < MaxChunkSize){
    return size;
  }
  var c = Math.ceil(size/5000);
  return Math.max(c, MaxChunkSize);
}

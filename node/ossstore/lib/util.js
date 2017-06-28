var path = require('path');
var fs = require('fs');

try{
  var crc64 = require('../../crc64');
}catch(e){
  console.error('Can not load crc64 module:',e);
}

module.exports = {
  parseLocalPath: parseLocalPath,
  parseOssPath: parseOssPath,
  closeFD: closeFD,
  getFileCrc64: getFileCrc64
};


function getFileCrc64(p, fn){
  if(!crc64){
    console.warn('not found crc64 module');
    fn(null, null);
    return;
  }
  crc64.check_stream(fs.createReadStream(p), function(err, data){
    fn(err, data);
  });
};


function parseLocalPath(p) {
  if (typeof(p) != 'string') {
    return p;
  }
  return {name: path.basename(p), path: p};
}


function parseOssPath(osspath) {
  if (typeof(osspath) != 'string') {
    return osspath;
  }

  if (!osspath.startsWith('oss://')) {
    throw Error('Invalid oss path');
  }

  var a = osspath.substring('oss://'.length);
  var bucket = a.split('/', 1)[0];
  var key = a.substring(bucket.length + 1);
  return {
    bucket: bucket,
    key: key
  };
}


function closeFD(fd) {

  try {
    if(fd) {
      fs.closeSync(fd);
      fd=null;
    }
  } catch (e) {
  }

}

var path = require('path');
var fs = require('fs');

try{
  var CRC64 = require('../../crc64');
}catch(e){
  console.error('Can not load crc64 module:',e);
}

module.exports = {
  parseLocalPath: parseLocalPath,
  parseOssPath: parseOssPath,
  getFileCrc64: getFileCrc64
};

function getFileCrc64(p, fn){
  if(!CRC64){
    console.warn('not found crc64 module');
    fn(null, null);
    return;
  }
  console.time('get crc64 hash for ['+p+']');
  var stream = fs.createReadStream(p, {autoClose: true});
  CRC64.check_stream(stream, function(err, data){
    //stream.close();
    console.timeEnd('get crc64 hash for ['+p+']');
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

var path = require('path');
var fs = require('fs');


var CRC64 = require('../../crc64');

module.exports = {
  parseLocalPath: parseLocalPath,
  parseOssPath: parseOssPath,
  getFileCrc64: getFileCrc64
};

function getFileCrc64(p, fn){
  console.time('get crc64 hash for ['+p+']');
  CRC64.crc64File(p, function(err, data){
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

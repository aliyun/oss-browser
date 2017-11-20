var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

var CRC64 = require('../../crc64');

module.exports = {
  parseLocalPath: parseLocalPath,
  parseOssPath: parseOssPath,
  getFileCrc64: getFileCrc64,
  getBigFileMd5: getBigFileMd5
};

function getBigFileMd5(p, fn){
  console.time('get md5 hash for ['+p+']');
   var md5sum = crypto.createHash('md5');
   var stream = fs.createReadStream(p);
   stream.on('data', function(chunk) {
       md5sum.update(chunk);
   });
   stream.on('end', function() {
     str = md5sum.digest('base64');
     console.timeEnd('get md5 hash for ['+p+']');
     fn(null, str);
   });
   stream.on('error', function(err) {
     fn(err);
   });
}

function getFileCrc64(p, fn){
  console.time('get crc64 hash for ['+p+']');
  CRC64.crc64File(p, function(err, data){
    console.timeEnd('get crc64 hash for ['+p+']');
    console.log(data);
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

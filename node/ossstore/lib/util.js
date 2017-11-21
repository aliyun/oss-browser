var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

var CRC64 = require('../../crc64/index.js');

module.exports = {
  parseLocalPath: parseLocalPath,
  parseOssPath: parseOssPath,
  getFileCrc64: getFileCrc64,
  getBigFileMd5: getBigFileMd5,
  checkFileHash: checkFileHash
};


function checkFileHash(filePath, hashCrc64ecma,fileMd5, fn) {
  //console.log(filePath, ',,,,,,,,,,,,,,,,,')
  if(hashCrc64ecma){
      console.time(`check crc64 ${filePath}`);
    getFileCrc64(filePath, function(err, crc64Str){
      console.timeEnd(`check crc64 ${filePath}`);
      if (err) {
        fn(new Error('Checking file['+filePath+'] crc64 hash failed: ' + err.message));
      } else if (crc64Str!=null && crc64Str != hashCrc64ecma) {
        fn(new Error('HashCrc64ecma mismatch, file['+filePath+'] crc64 hash should be:'+hashCrc64ecma+', but we got:'+crc64Str));
      } else{
        console.info('check crc success: file['+filePath+'],'+crc64Str)
        fn(null);
      }
    });
  }
  else if(fileMd5){

    //检验MD5
    getBigFileMd5(filePath, function (err, md5str) {
      if (err) {
        fn(new Error('Checking md5 failed: ' + err.message));
      } else if (md5str != fileMd5) {
        fn(new Error('ContentMD5 mismatch, file md5 should be:'+fileMd5+', but we got:'+md5str));
      } else{
        console.info('check md5 success: file['+filePath+'],'+md5str)
        fn(null);
      }
    });
  }
  else{
    //没有MD5，不校验
    console.log(filePath,',not found content md5, just pass');
    fn(null);
    return;
  }
}

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

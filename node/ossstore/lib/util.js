var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

var CRC64 = require('../../crc64/index.js');

module.exports = {
  parseLocalPath: parseLocalPath,
  parseOssPath: parseOssPath,
  getFileCrc64: getFileCrc64,
  getBigFileMd5: getBigFileMd5,
  checkFileHash: checkFileHash,
  printPartTimeLine: printPartTimeLine
};

function printPartTimeLine(opt){
  var min=opt[1].start,max=opt[1].end;
  for(var k in opt){
    min = Math.min(opt[k].start, min);
    max = Math.max(opt[k].end, max)
  }
  //console.log(min, max)

  var total = max-min;
  var width = 600;

  var t=[];
  for(var k in opt){
    t.push({
      left: (opt[k].start - min)*600/total,
      width: (opt[k].end - opt[k].start)*600/total,
    });
  }

  //console.log(JSON.stringify(t, ' ',2));

  //var t2=[];
  for(var n of t){
    console.log('%c',`background:green;margin-left:${n.left}px;padding-left:${n.width}px;`)
    //t2.push(`<div style="height:6px;background:green;width:${n.width}px;margin-left:${n.left}px;clear:both;margin-top:1px;"></div>`)
  }
  console.log(t.length+' parts')
}


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
  CRC64.crc64FileProcess(p, function(err, data){
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

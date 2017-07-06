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
  closeFD: closeFD,
  getFileCrc64: getFileCrc64
};

function getFileCrc64(p, fn){
  if(!CRC64){
    console.warn('not found crc64 module');
    fn(null, null);
    return;
  }

  var arr = [];
  var c = 0;
  _dig();

  //至少获取 2 遍，如果有2个一样的，则返回
  function _dig(){
    console.time('get crc64 hash for ['+p+']');
    var stream = fs.createReadStream(p,{autoClose: true});
    CRC64.check_stream(stream, function(err, data){
      //stream.close();
      console.timeEnd('get crc64 hash for ['+p+']');

      if(err)fn(err);
      else{
         arr[c]=data;
         c++;
         if(c>1){
           var m={};
           for(var i=0;i<arr.length;i++){
             if(!m[arr[i]]){
               m[arr[i]]=1;
             }
             else{
               if(arr.length>2) console.error('crc64 hash for ['+p+']', arr);
               //else console.info('crc64 hash for ['+p+']', arr);
               fn(null, data);
               return;
             }
           }
         }else{
           _dig();
         }
      }
    });
  }
};


function getFileCrc64_2(p, fn){
  if(!CRC64){
    console.warn('not found crc64 module');
    fn(null, null);
    return;
  }
  console.time('get crc64 hash for ['+p+']');
  var stream = fs.createReadStream(p);
  CRC64.check_stream(stream, function(err, data){
    stream.close();
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


function closeFD(fd) {

  try {
    if(fd) {
      fs.closeSync(fd);
      fd=null;
    }
  } catch (e) {
  }

}

var path = require('path');
var fs = require('fs');

module.exports = {
  parseLocalPath: parseLocalPath,
  parseOssPath: parseOssPath,
  closeFD: closeFD
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

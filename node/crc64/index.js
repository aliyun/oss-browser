const cp = require('child_process');
const path = require('path');

console.log(`run on: platform=${process.platform},arch=${process.arch}`);

try{
  var obj = require('./electron-crc64-prebuild');
  //var obj = require('./cpp-addon');
  console.log('loaded: crc64-cpp-addon');

}catch(e){
  console.warn(e)
  var obj = require('./pure-js');
  console.log('loaded: crc64-pure-js');
}


obj.crc64FileProcess = function(p, fn){
  var proc = cp.fork(path.join(__dirname, 'fork.js'), [p])
  proc.on('message', function(data){
     fn(data.error, data.data)
  });
}

module.exports = obj;

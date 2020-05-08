const cp = require("child_process");
const path = require("path");
const fs = require("fs");

console.log(`run on: platform=${process.platform},arch=${process.arch}`);

try {
  var obj = require("./electron-crc64-prebuild");
  //var obj = require('./cpp-addon');
  console.log("loaded: crc64-cpp-addon");
} catch (e) {
  console.warn(e);
  var obj = require("./pure-js");
  console.log("loaded: crc64-pure-js");
}

// obj.crc64FileProcess = function(p, fn){
//   var proc = cp.fork(path.join(__dirname, 'fork.js'), [p])
//   proc.on('message', function(data){
//      fn(data.error, data.data)
//   });
// }

obj.crc64FileProcess = function (p, fn) {
  fs.stat(p, function (err, data) {
    if (err) fn(err);
    else {
      if (data.size > 100 * 1024) {
        var proc = cp.fork(path.join(__dirname, "fork.js"), [p]);
        proc.on("message", function (data) {
          fn(data.error, data.data);
        });
      } else {
        obj.crc64File(p, fn);
      }
    }
  });
};

obj.crc64StreamProcess = function (p, fn) {
  // fs.stat(p, function(err, data){
  //   if(err)fn(err);
  //   else{
  //     if(data.size > 100 * 1024){
  //       var proc = cp.fork(path.join(__dirname, 'fork.js'), [p])
  //       proc.on('message', function(data){
  //         fn(data.error, data.data)
  //       });
  //     }else{
  //       obj.crc64Stream(p,fn);
  //     }
  //   }
  // });
  obj.crc64Stream(p, fn);
};

obj.combileCrc64Process = function (str1, str2, len2, fn) {
  obj.combileCrc64Process(str1, str2, len2, function (err, data) {
    fn(err, data);
  });
};

module.exports = obj;

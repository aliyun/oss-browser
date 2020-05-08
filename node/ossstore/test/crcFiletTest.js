// 切割大文件，分别计算crc64,然后计算整个crc64，分块计算进行比对

var fs = require("fs");
var path = require("path");
var should = require("should");

//需要到 node/crc64/下运行 npm test
var util = require("../lib/util");

// util.getFileCrc64(path.join(__dirname, 'app.asar'), function(err, data){
//   console.log(err, data);
//   data.should.equal('6143515797969536685');
// });

const stream = fs.createReadStream("./app.asar");

let buffers = [];
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    stream.on("error", reject);
    stream.on("data", (data) => buffers.push(data));
    stream.on("end", () => resolve(Buffer.concat(buffers)));
  });
}
var crc = [];
// 里面是一个单独的对象{crc:6143515797969536685, len: }
streamToBuffer(stream).then((res) => {
  console.log("buffers的长度================>" + buffers.length);
  util.getBufferCrc64(res, function (err, data) {
    console.log("总buffer对应的CRC===================>" + data);
    data.should.equal("6143515797969536685");
  });
  for (var i = 0; i < buffers.length; i++) {
    var len = Buffer.byteLength(buffers[i]);
    var obj = {};
    util.getBufferCrc64(buffers[i], function (err, data) {
      obj.crc = data;
      obj.len = len;
      crc.push(obj);
    });
  }
  console.log("所有的crc =======================>");
  console.log(crc);
  // 循环计算
  // var temp = crc[0].crc
  // for (var j = 0; j < crc.length-1; j++) {
  //   util.combileCrc64(temp, crc[j+1].crc,crc[j+1].len, function(err, data) {
  //     if(err) console.log(err)
  //     temp = data;
  //     console.log(data)
  //   })
  // }
  // console.log("finale combile crc64 ===========================> " + temp )
  util.crcFinal(crc).should.equal("6143515797969536685");
});

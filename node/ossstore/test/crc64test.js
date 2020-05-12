var Store = require("../");
var path = require("path");
var fs = require("fs");
var should = require("should");

//需要到 node/crc64/下运行 npm test
var util = require("../lib/util");

const filename = path.join(__dirname, "index.js");
const stream = fs.createReadStream(filename);

// 定义stream to buffer
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    let buffers = [];
    stream.on("error", reject);
    stream.on("data", (data) => buffers.push(data));
    stream.on("end", () => resolve(Buffer.concat(buffers)));
  });
}

util.getFileCrc64(path.join(__dirname, "index.js"), function (err, data) {
  console.log(err, data);
  data.should.equal("12426971715046612902");
});

util.getStreamCrc64(stream, function (err, data) {
  console.log(err, data);
  data.should.equal("12426971715046612902");
});
// //
util.combileCrc64("12426971715046612902", "12896971715046612902", 20, function (
  err,
  data
) {
  console.log(err, data);
});

streamToBuffer(stream).then(function (res) {
  util.getBufferCrc64(res, function (err, data) {
    console.log(err, data);
    data.should.equal("12426971715046612902");
  });
});

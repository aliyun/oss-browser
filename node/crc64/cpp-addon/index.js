var path = require("path");
var fs = require("fs");
var CRC64 = require("./crc64");

exports.crc64 = function (buf, pre) {
  return CRC64.check(pre || "0", buf);
};
exports.crc64File = function (p, fn) {
  if (!CRC64) {
    console.warn("not found crc64 module");
    fn(null, null);
    return;
  }
  //console.time('get crc64 hash for ['+p+']');
  var stream = fs.createReadStream(p, { autoClose: true });
  CRC64.check_stream(stream, function (err, data) {
    //stream.close();
    //console.timeEnd('get crc64 hash for ['+p+']');
    fn(err, data);
  });
};

// 假设2500分片，每片刚好40M 计算下时间 41943040

var util = require("../lib/util");
var crc = [];

//假设crc都一样
for (var i = 0; i < 2500; i++) {
  var m = i;
  crc.push(m.toString());
}

var start = new Date();
let temp = crc[0];
for (var i = 0; i < 2499; i++) {
  console.log(i);
  util.combileCrc64(temp, crc[i + 1], 41943040, function (err, data) {
    if (err) console.log(err);
    temp = data;
    console.log(data);
  });
}
var end = new Date();
console.log("crc compibe is ==============>" + temp);
console.log("累计耗时 (ms)==============>" + parseInt(end - start));

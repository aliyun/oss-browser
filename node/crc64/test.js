var crc64 = require('./crc64.js')

var fs = require("fs")

console.log(crc64.check("123456789"));

console.log(crc64.check(0,"123456789"));

console.log(crc64.check("0","123456789"));

console.log(crc64.check(Buffer.from("123456789")));

console.log(crc64.check(0,Buffer.from("123456789")));

console.log(crc64.check("0",Buffer.from("123456789")));

// var readStream = fs.createReadStream('/Users/oliver/Desktop/test.dd');

// crc64.check_stream(readStream,(err, result)=>{
// 	if(!err){
// 		console.log(result);
// 	}else{
// 		console.log(err.stack)
// 	}
// });

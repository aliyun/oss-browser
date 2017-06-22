var crc64 = require('../crc64.js')
var path = require('path')
var fs = require("fs")

console.log(crc64.check("123456789"));

console.log(crc64.check(0,"123456789"));

console.log(crc64.check("0","123456789"));

console.log(crc64.check(Buffer.from("123456789")));

console.log(crc64.check(0,Buffer.from("123456789")));

console.log(crc64.check("0",Buffer.from("123456789")));


var readStream = fs.createReadStream(path.join(__dirname,'apps.png'));

crc64.check_stream(readStream, (err, result)=>{
	if(!err){
		console.log(result);
	}else{
		console.log(err)
	}
});

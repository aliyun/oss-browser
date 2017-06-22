var crc64 = require('../crc64.js')
var path = require('path')
var fs = require("fs")
const assert = require('assert');

const result1 = '11051210869376104954';
const result2 = '5178350320981835788';

var r1 = crc64.check("123456789");
console.log(r1);
assert(r1 === result1);

var r2 = crc64.check(0,"123456789");
console.log(r2);
assert(r2 === result1);

var r3 = crc64.check("0","123456789");
console.log(r3);
assert(r3 === result1);

var r4 = crc64.check(Buffer.from("123456789"))
console.log(r4);
assert(r4 === result1);

var r5 = crc64.check(0,Buffer.from("123456789"))
console.log(r5);
assert(r5 === result1);

var r6 = crc64.check("0",Buffer.from("123456789"));
console.log(r6);
assert(r6 === result1)

var readStream = fs.createReadStream(path.join(__dirname,'apps.png'));

crc64.check_stream(readStream, (err, result)=>{
	if(!err){
    console.log(result)
    assert(result === result2)
	}else{
		console.log(err)
	}
});

const CRC64 = require('./electron-crc64-prebuild');
// process.title="ossbch";

// CRC64.crc64Buffer(process.argv[2], function (err, data) {
//   if (err) process.send({error: err});
//   else process.send({data: data});
//   process.exit(0)
// })
CRC64.crc64Stream(process.stdin, function (err, data) {
  if (err) {
    process.exit(0);
  } else {
    process.stdout.write(data);
    process.stdout.end();
  }
});

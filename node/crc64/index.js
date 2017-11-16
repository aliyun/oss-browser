
console.log(`run on: platform=${process.platform},arch=${process.arch}`);
if(process.arch=='x64' && ['darwin','win32','linux'].indexOf(process.platform)!=-1){
  console.log('loading: crc64-cpp-addon');
  try{
    exports.crc64File = require('./cpp-addon').crc64File;
  }catch(e){
    console.log('loading: crc64-pure-js');
    exports.crc64File = require('./pure-js').crc64File;
  }
}
else {
  console.log('loading: crc64-pure-js');
  exports.crc64File = require('./pure-js').crc64File;
}

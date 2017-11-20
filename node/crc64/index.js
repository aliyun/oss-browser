
console.log(`run on: platform=${process.platform},arch=${process.arch}`);
if(process.arch=='x64' || (process.platform=='win32' && process.arch=='ia32')){

  try{
    //console.log(require('./cpp-addon').crc64('123456789'))
    exports.crc64File = require('./cpp-addon').crc64File;
    console.log('loaded: crc64-cpp-addon');

  }catch(e){
    console.warn(e)
    exports.crc64File = require('./pure-js').crc64File;
    console.log('loaded: crc64-pure-js');
  }
}
else {
  exports.crc64File = require('./pure-js').crc64File;
  console.log('loaded: crc64-pure-js');
}

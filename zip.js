// require modules
var fs = require('fs');
var archiver = require('archiver');
var pkg = require('./package');
var sh = require('shelljs')
var app_name = process.env.name || pkg.name;
var app_version = process.env.version || pkg.version;

if(process.argv.length>3){
  var dest = process.argv[2].trim();
  var src = process.argv[3].trim();
  zip(src+'**/*', dest)
  // var fileName='';
  // sh.mkdir('-p',`releases/${app_version}`)
  // switch(type){
  //   case 'mac': fileName = `${app_name}-darwin-x64`; break;
  //   case 'win32': fileName = `${app_name}-win32-ia32`; break;
  //   case 'win64': fileName= `${app_name}-win32-x64`; break;
  //   case 'linux32': fileName = `${app_name}-linux-ia32`; break;
  //   case 'linux64': fileName= `${app_name}-linux-x64`; break;
  // }
  // sh.rm('-rf',`releases/${app_version}/${fileName}`)
  // zip(`./build/${fileName}/**/*`, `./releases/${app_version}/${fileName}.zip`);
}



/**
* @param src 'subdir/*.txt'
* @param dest 'a.zip'
*/
function zip(src, dest){
  return new Promise((a,b)=>{
    // create a file to stream archive data to.
    var output = fs.createWriteStream(dest);//__dirname + '/example.zip'
    var archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
      a();
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function() {
      console.log('Data has been drained');
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        // log warning
        console.warning(err);
      } else {
        // throw error
        b(err)
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      b(err);
    });

    // pipe archive data to the file
    archive.pipe(output);

    // append files from a glob pattern
    archive.glob(src, false);

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();
  });
}

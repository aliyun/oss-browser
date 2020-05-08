// require modules
var fs = require("fs");
var archiver = require("archiver");
var pkg = require("./package");
var sh = require("shelljs");
var app_name = process.env.name || pkg.name;
var app_version = process.env.version || pkg.version;

if (process.argv.length > 3) {
  var dest = process.argv[2].trim();
  var src = process.argv[3].trim();
  if (process.platform != "win32")
    sh.exec(`zip ${dest} -r ${src}`, function (code, stdout, stderr) {
      if (stderr) console.log(stderr);
    });
  else {
    if (src.indexOf("darwin") != -1) {
      console.log(
        "can not zip *.app for mac os in windows, you should zip it manually! Location is " +
          dest
      );
    } else zip(src, dest);
  }
}

/**
 * @param src 'subdir/'
 * @param dest 'a.zip'
 */
function zip(src, dest) {
  return new Promise((a, b) => {
    // create a file to stream archive data to.
    var output = fs.createWriteStream(dest); //__dirname + '/example.zip'
    var archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on("close", function () {
      console.info(archive.pointer() + " total bytes");
      console.info(
        "archiver has been finalized and the output file descriptor has closed."
      );
      a();
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on("end", function () {
      console.info("Data has been drained");
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on("warning", function (err) {
      if (err.code === "ENOENT") {
        // log warning
        console.warn(err);
      } else {
        // throw error
        b(err);
      }
    });

    // good practice to catch this error explicitly
    archive.on("error", function (err) {
      b(err);
    });

    // pipe archive data to the file
    archive.pipe(output);

    // append files from a glob pattern
    archive.directory(src);

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();
  });
}

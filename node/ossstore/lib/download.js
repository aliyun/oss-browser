var fs = require('fs');
var OSS = require('ali-oss');

process.on('message', function (m) {
  /**
   * oss, tmpName, object, opt
   * @type {WriteStream}
   */
    // process.send(m)

  var store = new OSS(m.options);
  var fileStream = fs.createWriteStream(m.tmpName, {
    start: m.start,
    flags: 'a+',
    autoClose: true,
  });
  store.get(m.object, fileStream, {
      headers: {
        Range: `bytes=${m.start}-${m.end - 1}`
      }
    }
  ).then(() => {
    console.log('true', m.start);
    process.send({
      success: true
    })
  });
})

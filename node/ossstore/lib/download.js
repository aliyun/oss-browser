var fs = require('fs');
module.exports = {
  download: downlad
}

function d(self, p, fn) {
  var fileStream = fs.createWriteStream(tmpName, {
    start: start,
    flags: 'a+',
    autoClose: true,
  });
  self.aliOSS.get(objOpt.Key, fileStream, {
    headers: {
      Range: `bytes=${start}-${end - 1}`
    }
  }).then(() => {
  });
}

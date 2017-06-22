'use strict';
const version_path = process.platform + '-' + process.arch;

var _crc64;
if (process.env.NODE_ENV = 'test') _crc64 = require('./build/Release/crc64');
else _crc64 = require('./lib/' + version_path + '/Release/crc64');
const _stream = require('stream');

class CRC64 {

  check() {
    var init_crc = 0;
    var content = null;
    var typeErrorMessage = "Only (string|buffer) or (string|number, string|bufffer) accepted!";
    if (arguments.length == 1) {
      content = arguments[0];
    } else if (arguments.length == 2) {
      init_crc = arguments[0];
      content = arguments[1];
    } else {
      throw new TypeError(typeErrorMessage);
    }
    if (typeof init_crc === 'number') {
      init_crc = init_crc.toString();
    }
    if (typeof init_crc != 'string') {
      throw new TypeError(typeErrorMessage);
    }
    if (typeof content == 'string' || Buffer.isBuffer(content))
      content = Buffer.from(content);
    else {
      throw new TypeError(typeErrorMessage);
    }
    return _crc64.get(init_crc, content);
  }

  check_stream(stream, callback) {
    if (!(stream instanceof _stream.Stream))
      throw new TypeError("Only (stream, callback) accepted!");
    var init_crc = 0;
    stream.on('data', (chunk) => {
      init_crc = this.check(init_crc, chunk);
    });
    stream.on('end', () => {
      callback(null, init_crc);
    });
    stream.on('error', (err) => {
      callback(err, null);
    });
  }
}

module.exports = new CRC64();

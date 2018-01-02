'use strict';

const fs = require('fs');

const binding = require('./lib/index');

exports.crc64 = function(buff, prev){
  return this.toUInt64String(this.check(buff, prev))
}

/**
 * Calculate the CRC64-ECMA182 of a buffer
 * @param {Buffer} buff the buffer to be calculated
 * @param {Buffer} [prev] the previous CRC64-ECMA182 result
 * @returns {Buffer} the result, if `prev` is passed then the `result` is `prev`
 */
 exports.check = function(buff, prev) {
     if(typeof buff === 'string') {
         buff = new Buffer(buff);
     }

     if(!Buffer.isBuffer(buff) || (prev && !Buffer.isBuffer(prev))) {
         throw new Error('Arguments should be instance of Buffer.');
     }

     return binding.crc64.apply(null, prev ? [ buff, prev ] : [ buff ]);
 };


/**
 * Convert a result buffer into a UInt64 string
 * @param {Buffer} buff the buffer to be converted
 * @returns {String} the result string
 */
exports.toUInt64String = function(buff) {
    if(!(buff instanceof Buffer) || (buff.length != 8)) {
        throw new Error('Argument should be an 8-length buffer.');
    }

    return binding.toUInt64String(buff);
};

/**
 * Calculate the CRC64-ECMA182 of a file
 * @param {String} filename the filename
 * @param {Boolean} [toString] whether the result should convert to string or not, default to `true`
 * @param {Function} callback the callback function
 */
exports.crc64File = function(filename, toString, callback) {
    if(typeof toString === 'function') {
        callback = toString;
        toString = true;
    }

    let errored = false;
    const stream = fs.createReadStream(filename);
    stream.on('error', function(err) {
        errored = true;
        stream.destroy();
        return callback(err);
    });

    const ret = Buffer.alloc(8);
    stream.on('data', function(chunk) {
        exports.check(chunk, ret);
    });
    stream.on('end', function() {
        if(errored) return;
        return callback(undefined, toString ? exports.toUInt64String(ret) : ret);
    });
};

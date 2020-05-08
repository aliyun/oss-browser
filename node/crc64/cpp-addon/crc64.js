"use strict";
const version_path = process.platform + "-" + process.arch;
const path = require("path");
const fs = require("fs");

var _crc64 =
  process.env.NODE_ENV == "test"
    ? require(path.join(__dirname, "build/Release/crc64"))
    : require(path.join(__dirname, "lib/" + version_path + "/Release/crc64"));

const _stream = require("stream");

module.exports = {
  check: function () {
    var init_crc = 0;
    var content = null;
    var typeErrorMessage =
      "Only (string|buffer) or (string|number, string|bufffer) accepted!";
    if (arguments.length == 1) {
      content = arguments[0];
    } else if (arguments.length == 2) {
      init_crc = arguments[0];
      content = arguments[1];
    } else {
      throw new TypeError(typeErrorMessage);
    }
    if (typeof init_crc === "number") {
      init_crc = init_crc.toString();
    }
    if (typeof init_crc != "string") {
      throw new TypeError(typeErrorMessage);
    }
    if (typeof content == "string" || Buffer.isBuffer(content))
      content = Buffer.from(content);
    else {
      throw new TypeError(typeErrorMessage);
    }
    return _crc64.get(init_crc, content);
  },

  check_stream: function (stream, callback) {
    if (!(stream instanceof _stream.Stream))
      throw new TypeError("Only (stream, callback) accepted!");
    var init_crc = 0;
    stream.on("data", (chunk) => {
      init_crc = this.check(init_crc, chunk);
    });
    stream.on("end", () => {
      callback(null, init_crc);
      try {
        if (stream) stream.close();
      } catch (e) {}
    });
    stream.on("error", (err) => {
      callback(err, null);
      try {
        if (stream) stream.close();
      } catch (e) {}
    });
  },
};

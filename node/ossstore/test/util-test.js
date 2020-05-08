var Store = require("../");
var path = require("path");
var fs = require("fs");
var should = require("should");

//需要到 node/crc64/下运行 npm test
var util = require("../lib/util");

describe("util.js", function () {
  this.timeout(60000);

  describe("parseOssPath", function () {
    it("parseOssPath", function () {
      var obj = util.parseOssPath("oss://abc/123");
      obj.bucket.should.equal("abc");
      obj.key.should.equal("123");
    });
  });

  describe("getFileCrc64", function () {
    it("getFileCrc64", function (done) {
      util.getFileCrc64(path.join(__dirname, "index.js"), function (err, data) {
        console.log(err, data);
        data.should.equal("12426971715046612902");
        done();
      });
    });

    it("multi getFileCrc64", function (done) {
      var len = 1000;
      var c = 0;

      var RESULT = "12426971715046612902";

      _dig();
      function _dig() {
        util.getFileCrc64(path.join(__dirname, "index.js"), function (
          err,
          data
        ) {
          console.log(err, data);
          data.should.equal(RESULT);
          c++;
          if (c >= len) done();
          else _dig();
        });
      }
    });
  });
});

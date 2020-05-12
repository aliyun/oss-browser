var CRC64 = require("../crc64.js");
var path = require("path");
var fs = require("fs");
const assert = require("assert");

require("should");

const result1 = "11051210869376104954";
const result2 = "5178350320981835788";

describe("crc64", function () {
  this.timeout(60000);
  describe("test1", function () {
    it("check", function () {
      var r1 = CRC64.check("123456789");
      console.log(r1);
      r1.should.equal(result1);

      var r2 = CRC64.check(0, "123456789");
      console.log(r2);
      r2.should.equal(result1);

      var r3 = CRC64.check("0", "123456789");
      console.log(r3);
      r3.should.equal(result1);

      var r4 = CRC64.check(Buffer.from("123456789"));
      console.log(r4);
      r4.should.equal(result1);

      var r5 = CRC64.check(0, Buffer.from("123456789"));
      console.log(r5);
      r5.should.equal(result1);

      var r6 = CRC64.check("0", Buffer.from("123456789"));
      console.log(r6);
      r6.should.equal(result1);
    });

    it("loop check", function () {
      for (var i = 0; i < 100; i++) {
        var r6 = CRC64.check(0, Buffer.from("123456789"));
        console.log(r6);
        r6.should.equal(result1);
      }
    });
  });
  describe("test2", function () {
    it("check_stream", function (done) {
      var readStream = fs.createReadStream(path.join(__dirname, "apps.png"));

      CRC64.check_stream(readStream, (err, result) => {
        if (!err) {
          console.log(result);
          result.should.equal(result2);
        } else {
          console.log(err);
        }
        done();
      });
    });

    it("check_stream 串行", function (done) {
      var len = 100;
      var c = 0;

      _dig();
      function _dig() {
        var readStream = fs.createReadStream(path.join(__dirname, "apps.png"));

        CRC64.check_stream(readStream, (err, result) => {
          if (!err) {
            console.log(result);
            result.should.equal(result2);
            readStream.close();

            c++;
            if (c >= len) done();
            else setTimeout(_dig, 10);
          } else {
            console.log(err);
          }
        });
      }
    });

    it("check_stream 并行", function (done) {
      var len = 100;
      var c = 0;

      for (var i = 0; i < len; i++) setTimeout(_dig, 100);
      function _dig() {
        var readStream = fs.createReadStream(path.join(__dirname, "apps.png"));

        CRC64.check_stream(readStream, (err, result) => {
          if (!err) {
            console.log(result);
            result.should.equal(result2);
            readStream.close();

            c++;
            if (c >= len) done();
            //else setTimeout(_dig,10);
          } else {
            console.log(err);
          }
        });
      }
    });
  });
});

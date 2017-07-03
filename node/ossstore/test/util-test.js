
var Store = require('../');
var path = require('path');
var fs = require('fs');
var should = require('should');

//需要到 node/crc64/下运行 npm test
var util = require('../lib/util');

describe('util.js', function () {

  //this.timeout(3600*1000);

  it('parseOssPath', function () {
     var obj = util.parseOssPath('oss://abc/123');
     obj.bucket.should.equal('abc');
     obj.key.should.equal('123');
  });


});

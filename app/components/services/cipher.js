angular.module("web").factory("Cipher", function () {
  var crypto = require("crypto");
  // 通过crypto.getCiphers()确认，aes192算法已不被支持
  // todo: 历史数据的保存方案
  var ALGORITHM = "aes-192-cbc";
  var KEY = "x82m#*lx8vv0123456789abc";
  var IV = "1234567890123456";

  return {
    cipher: cipher,
    decipher: decipher,
  };

  function cipher(buf, key, algorithm) {
    if (!(buf instanceof Buffer)) {
      buf = Buffer.from(buf);
    }
    var encrypted = "";
    var cip = crypto.createCipheriv(algorithm || ALGORITHM, key || KEY, IV);
    encrypted += cip.update(buf, "utf8", "hex");
    encrypted += cip.final("hex");
    return encrypted;
  }

  function decipher(encrypted, key, algorithm) {
    var decrypted = "";
    var decipher = crypto.createDecipheriv(
      algorithm || ALGORITHM,
      key || KEY,
      IV
    );
    decrypted += decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
});

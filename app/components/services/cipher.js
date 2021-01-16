angular.module("web").factory("Cipher", function () {
  const crypto = require("crypto");
  // electron内置的crypto模块中，通过crypto.getCiphers()确认，aes192算法已不被支持
  const ALGORITHM = "aes-192-cbc";
  const KEY = "x82m#*lx8vv0123456789abc";
  const IV = "1234567890123456";

  return {
    cipher: cipher,
    decipher: decipher,
  };

  function cipher(buf, key = KEY, algorithm = ALGORITHM) {
    let encrypted = "";
    const cip = crypto.createCipheriv(algorithm || ALGORITHM, key || KEY, IV);
    encrypted += cip.update(buf, "utf8", "hex");
    encrypted += cip.final("hex");
    return encrypted;
  }

  function decipher(encrypted, key = KEY, algorithm = ALGORITHM) {
    try {
      let decrypted = "";
      const decipher = crypto.createDecipheriv(algorithm, key, IV);
      decrypted += decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (e) {
      console.log("Decryption algorithm using legacy during migration...");
      return legacy_decipher(encrypted);
    }
  }

  function legacy_decipher(encrypted) {
    const { createDecipher } = require("browserify-cipher/browser");
    const algorithm = "aes192";
    const key = "x82m#*lx8vv";
    let decrypted = "";
    const decipher = createDecipher(algorithm, key);
    decrypted += decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
});

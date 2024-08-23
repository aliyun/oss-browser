angular.module('web').factory('Cipher', function() {
  var crypto = require('crypto');
  var ALGORITHM = 'aes-256-cbc';
  // var KEY = 'x82m#*lx8vv';
  var KEY = Buffer.from('x82m#*lx8vvy93n#*my9wwz04o#*nz0x');
  var IV = Buffer.from('*my9wwz04o#*nz0x');

  return {
    cipher: cipher,
    decipher: decipher
  };

  function cipher(buf, key, algorithm, iv) {
    var encrypted = '';
    var cip = crypto.createCipheriv(algorithm || ALGORITHM, key || KEY, iv || IV);

    encrypted += cip.update(buf, 'utf8', 'hex');
    encrypted += cip.final('hex');

    return encrypted;
  }

  function decipher(encrypted, key, algorithm, iv) {
    var decrypted = '';
    var decipher = crypto.createDecipheriv(algorithm || ALGORITHM, key || KEY, iv || IV);

    decrypted += decipher.update(Buffer.from(encrypted, 'hex'), null, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
});

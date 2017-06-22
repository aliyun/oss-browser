const shell = require('shelljs');
const path = require('path');
const VERSION = '1.6.11';

shell.rm('-rf', 'build')
shell.exec(`HOME=~/.electron-gyp node-gyp configure build --target=${VERSION} --arch=${process.arch} --dist-url=https://atom.io/download/atom-shell`);

var target = path.join(__dirname, 'lib/'+process.platform+'-'+process.arch);
shell.rm('-rf', target);
shell.mv('-f','build', target);

console.log('done');

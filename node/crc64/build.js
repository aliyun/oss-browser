require('shelljs/global')

const VERSION = '1.6.11';

exec(`HOME=~/.electron-gyp node-gyp rebuild --target=${VERSION} --arch=${process.arch} --dist-url=https://atom.io/download/atom-shell`)

exec('build -rf dist/'+process.platform+'-'+process.arch)
console.log('done')


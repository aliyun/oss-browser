const shell = require("shelljs");
const path = require("path");
const VERSION = "1.8.4";
const ELECTRON_ERROR = "https://npm.taobao.org/mirrors/electron";

shell.rm("-rf", "build");
shell.mkdir("build");

var buildCmd = `node-gyp configure build --runtime=electron --target=${VERSION} --arch=${process.arch} --dist-url=https://atom.io/download/electron`;
if (process.platform == "win32") {
  shell.exec(
    `set HOME=~/.electron-gyp && set ELECTRON_ERROR=${ELECTRON_ERROR} && ${buildCmd}`
  );
} else {
  shell.exec(
    `HOME=~/.electron-gyp ELECTRON_ERROR=${ELECTRON_ERROR} ${buildCmd}`
  );
}

var target = path.join(__dirname, `lib/${process.platform}-${process.arch}`);
shell.rm("-rf", target);
console.log(`mv -f build ${target}`);
shell.mv("-f", "build", target);

console.log("done");

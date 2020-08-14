/**
 * 编译cpp addon源码获取对应electron版本的.node文件
 */
const shell = require("shelljs");
const path = require("path");
const fs = require("fs");
const ELECTRON_VERSION = require("electron/package.json").version;
const ELECTRON_ERROR = "https://npm.taobao.org/mirrors/electron";
const base_crc64_addon_dir = path.join(__dirname, "../");

var buildCmd = `node-gyp rebuild --runtime=electron --directory=${base_crc64_addon_dir} --target=${ELECTRON_VERSION} --arch=${process.arch} --dist-url=https://atom.io/download/electron`;
if (process.platform == "win32") {
  shell.exec(
    `set HOME=~/.electron-gyp && set ELECTRON_ERROR=${ELECTRON_ERROR} && ${buildCmd}`
  );
} else {
  shell.exec(
    `HOME=~/.electron-gyp ELECTRON_ERROR=${ELECTRON_ERROR} ${buildCmd}`
  );
}

const target_dir = path.join(
  base_crc64_addon_dir,
  `lib/${process.platform}-${process.arch}/`
);
shell.rm("-r", target_dir);
shell.mkdir("-p", target_dir);

const nodeFile = fs
  .readdirSync(path.join(base_crc64_addon_dir, "build/Release"))
  .find((file) => file !== ".node" && file.endsWith(".node"));

if (!nodeFile) throw new Error("electron-build fail.");

shell.mv(
  "-f",
  path.join(base_crc64_addon_dir, "build/Release/", nodeFile),
  target_dir
);

shell.rm("-r", path.join(base_crc64_addon_dir, "build/"));

const crc64_entry = path.join(base_crc64_addon_dir, "lib/index.js");
fs.writeFileSync(
  crc64_entry,
  "module.exports = require(`./${process.platform}-${process.arch}/" +
    path.basename(nodeFile) +
    "`);\n"
);

console.log(`Done: electron-version: ${ELECTRON_VERSION}, rebuild ${nodeFile}`);

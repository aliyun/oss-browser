const { rebuild } = require("electron-rebuild");
const path = require("path");
const fs = require("fs");
const shell = require("shelljs");
const ELECTRON_VERSION = require("electron/package.json").version;

const base_crc64_addon_dir = path.join(__dirname, "../");

rebuild({
  buildPath: base_crc64_addon_dir,
  electronVersion: ELECTRON_VERSION,
  force: true,
}).then(() => {
  const target_dir = path.join(
    base_crc64_addon_dir,
    `lib/${process.platform}-${process.arch}/`
  );
  shell.rm("-r", target_dir);
  shell.mkdir("-p", target_dir);

  const nodeFile = fs
    .readdirSync(path.join(base_crc64_addon_dir, "build/Release"))
    .find((file) => file !== ".node" && file.endsWith(".node"));

  if (!nodeFile) throw new Error("electron-rebuild fail.");

  shell.mv(
    "-f",
    path.join(base_crc64_addon_dir, "build/Release/", nodeFile),
    target_dir
  );

  shell.rm("-r", path.join(base_crc64_addon_dir, "bin/"));
  shell.rm("-r", path.join(base_crc64_addon_dir, "build/"));

  const crc64_entry = path.join(base_crc64_addon_dir, "lib/index.js");
  fs.writeFileSync(
    crc64_entry,
    "module.exports = require(`./${process.platform}-${process.arch}/" +
      path.basename(nodeFile) +
      "`);\n"
  );
  console.log(
    `Done: electron-version: ${ELECTRON_VERSION}, rebuild ${nodeFile}`
  );
});

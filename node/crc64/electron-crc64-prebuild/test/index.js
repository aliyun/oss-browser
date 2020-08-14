const path = require("path");
const fs = require("fs");
const assert = require("assert");
const electron = require("electron");
const CRC64 = require("../");

async function main() {
  const result1 = "11051210869376104954";
  const result2 = "5178350320981835788";

  const r1 = CRC64.crc64("123456789");
  assert.strictEqual(r1, result1);

  assert.throws(() => CRC64.crc64(0, "123456789"), {
    name: "Error",
    message: "Arguments should be instance of Buffer.",
  });

  assert.throws(() => CRC64.crc64("0", "123456789"), {
    name: "Error",
    message: "Arguments should be instance of Buffer.",
  });

  const r4 = CRC64.crc64(Buffer.from("123456789"));
  assert.strictEqual(r4, result1);

  assert.throws(() => CRC64.crc64(0, Buffer.from("123456789")), {
    name: "Error",
    message: "Arguments should be instance of Buffer.",
  });

  assert.throws(() => CRC64.crc64("0", Buffer.from("123456789")), {
    name: "Error",
    message: "Argument should be an 8-length buffer.",
  });

  for (let i = 0; i < 100; i++) {
    const r7 = CRC64.crc64(Buffer.from("123456789"));
    assert.strictEqual(r7, result1);
  }

  await (async function () {
    await new Promise((resolve) => {
      const readStream = fs.createReadStream(path.join(__dirname, "apps.png"));
      CRC64.crc64Stream(readStream, (err, result) => {
        assert.ifError(err);
        assert.strictEqual(result, result2);
        resolve();
      });
    });
  })();

  // check_stream 串行
  await (async function series() {
    for (let i = 0; i < 100; i++) {
      const readStream = fs.createReadStream(path.join(__dirname, "apps.png"));
      await new Promise((resolve, reject) => {
        CRC64.crc64Stream(readStream, (err, result) => {
          assert.ifError(err);
          assert.strictEqual(result, result2);
          readStream.close();
          resolve();
        });
      });
    }
  })();

  // check_stream 并行
  await (function parallel() {
    Promise.all(
      Array.from({ length: 100 }).map(() => {
        return new Promise((resolve) => {
          const readStream = fs.createReadStream(
            path.join(__dirname, "apps.png")
          );
          CRC64.crc64Stream(readStream, (err, result) => {
            assert.ifError(err);
            assert.strictEqual(result, result2);
            readStream.close();
          });
        });
      })
    );
  })();
}

console.log(`Start testing electron-crc64-prebuild`);
main()
  .then(() => {
    console.log("Test electron-crc64-prebuild is successful");
    process.exit();
  })
  .catch((e) => {
    electron.dialog.showMessageBoxSync({
      type: "error",
      message: "Test crcr64-cpp-addon failed!",
      detail: e.message,
    });
    console.error("Test crcr64-cpp-addon failed!");
    process.exit(1);
  });

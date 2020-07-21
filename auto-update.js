const { app } = require("electron");
const EventEmitter = require("events");
const https = require("https");
// electron补丁版本的fs，不能正确判断asar文件信息，使用原生fs模块
const fs = require("original-fs");
const path = require("path");
const crc64 = require("./node/crc64");

// 完整资源压缩包名
const zip_file_name = `oss-browser-${process.platform}-${process.arch}.zip`;

/**
 * 升级信息文件获取地址
 *
 * 文件信息 upgrade.json
 *
 * 最新版本
 * version: ‘1.11.0’
 *
 * 用于打印下载地址
 * package_url: "https://oss-attachment.cn-hangzhou.oss.aliyun-inc.com/oss-browser/"
 *
 * 一组下载地址，从中选择最快的下载线路
 * package_urls: [
 *   "https://oss-attachment.cn-hangzhou.oss.aliyun-inc.com/oss-browser/"
 * ],
 *
 * 更新日志文件获取地址
 * release_note_url: "https://beajer-test.oss-cn-hangzhou.aliyuncs.com/release-notes/"
 *
 * 下载文件，优先增量更新,暂时只支持app.asar文件
 * files: [
 *   "app.asar"
 * ]
 *
 * 全量更新，手动下载
 * link: 'https://oss-attachment.cn-hangzhou.oss.aliyun-inc.com/oss-browser/${version}/${zip_file_name}
 */
const upgrader_url =
  "https://beajer-test.oss-cn-hangzhou.aliyuncs.com/upgrade.json";

// 资源下载地址
const get_full_server_url = (url, version, name) =>
  ensureSlash(url) + ensureSlash(version) + name;

// 更新日志地址
const get_full_release_note_url = (url, version, lang) =>
  ensureSlash(url) + version + (lang ? `.${lang}` : "") + ".md";

function ensureSlash(str) {
  if (!str.endsWith("/")) str = str + "/";
  return str;
}

function compareVersion(curV, lastV) {
  var arr = curV.split(".");
  var arr2 = lastV.split(".");

  var len = Math.max(arr.length, arr2.length);

  for (var i = 0; i < len; i++) {
    var a = parseInt(arr[i]);
    var b = parseInt(arr2[i]);

    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    }
  }
  return 0;
}

/**
 * 使用 asar 包情况，在 Windows 系统里 Electron 应用启动后 node 文件和 app.asar 都会被占用，不能直接修改和删除，必须结束 Electron 应用的进程后才可以替换这些文件。
 * 不使用 asar 包的情况，如果没有 C++ 原生模块可以直接替换 app 目录里的文件，如果存在同理不能直接替换。
 */

function moveFile(from, to, fn) {
  if (process.platform != "win32") {
    fs.rename(from, to, fn);
    return;
  }

  var readStream = fs.createReadStream(from);
  var writeStream = fs.createWriteStream(to);

  readStream.on("data", function (chunk) {
    if (writeStream.write(chunk) === false) {
      readStream.pause();
    }
  });
  readStream.on("error", function (err) {
    fn(err);
  });
  readStream.on("end", function () {
    writeStream.end();
    setTimeout(function () {
      fs.unlinkSync(from);
      fn();
    }, 200);
  });

  writeStream.on("drain", function () {
    readStream.resume();
  });
  writeStream.on("error", function (err) {
    fn(err);
  });
}

function throttle(fn, wait) {
  let timerId = null;
  let lastCallTime = null;
  return function (...args) {
    if (lastCallTime === null) {
      lastCallTime = Date.now();
      fn(...args);
      return;
    }

    let currentCallTime = Date.now();
    let timeSinceLastCall = currentCallTime - lastCallTime;
    if (timerId) {
      clearTimeout(timerId);
    }
    if (timeSinceLastCall > wait) {
      lastCallTime = currentCallTime;
      fn(...args);
    } else {
      timerId = setTimeout(() => {}, wait - timeSinceLastCall);
    }
  };
}

function getFasterUrl(arr) {
  if (arr.length === 0) {
    return Promise.reject();
  }
  if (arr.length === 1) {
    return Promise.resolve(arr[0]);
  }

  const timeout = 3000;
  const defaultLimit = 240;
  const promisifyGet = (url) => {
    return new Promise((resolve) => {
      https.get(url, (res) => {
        let p = 0;
        res
          .on("data", (chunk) => {
            p += chunk.length;
            if (p >= defaultLimit) {
              resolve(url);
              res.destroy();
            }
          })
          .on("end", () => resolve(url));
      });
    });
  };

  return Promise.race(
    arr.map(promisifyGet).concat(
      new Promise((_, reject) => {
        setTimeout(() => reject(), timeout);
      })
    )
  );
}

/**
 * @event checking-for-update
 * @event update-available
 * @event update-not-available
 * @event download-progress
 * @event update-downloaded
 * @event error
 * @member download
 * @member checkForUpdates
 * @member quitAndInstall
 */
class AutoUpdater extends EventEmitter {
  constructor() {
    super();
    this.tempFile = "";
    this.isChecking = false;
    this.isDownloading = false;
    this.updateInfo = null;

    // 是否自动下载
    this.autoDownload = false;
    // lang
    this.lang = "";
    // autoInstallOnAppQuit = false;
  }

  checkForUpdates() {
    if (this.isChecking || this.isDownloading) return;
    this.isChecking = true;
    this.emit("checking-for-update");
    https
      .get(upgrader_url, (res) => {
        const { statusCode } = res;
        const contentType = res.headers["content-type"];

        let error;
        if (statusCode !== 200) {
          error = new Error("Request Failed.\n" + `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
          error = new Error(
            "Invalid content-type.\n" +
              `Expected application/json but received ${contentType}`
          );
        }
        if (error) {
          this._emitError(error);
          // Consume response data to free up memory
          res.resume();
          return;
        }

        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          try {
            const parsedData = JSON.parse(rawData);
            this.updateInfo = parsedData;
            if (!this.updateInfo.link) {
              this.updateInfo.link = get_full_server_url(
                parsedData.package_url,
                parsedData.version,
                zip_file_name
              );
            }
            this.checkReleaseOrDownload();
          } catch (e) {
            this._emitError(e);
          }
        });
      })
      .on("error", (e) => {
        this._emitError(e);
      });
  }

  quitAndInstall() {
    const from = this.tempFile;
    const to = path.join(path.dirname(__dirname), "app.asar");
    if (this.isChecking || this.isDownloading || !fs.existsSync(from)) {
      return;
    }

    process.noAsar = true;

    moveFile(from, to, function (e) {
      if (e)
        fs.writeFileSync(
          path.join(app.getPath("userData"), "upgrade-error.txt"),
          JSON.stringify(e)
        );
      app.relaunch();
      app.exit(0);
    });
  }

  setConfig(cfg) {
    if (cfg.autoDownload !== undefined) {
      this.autoDownload = !!cfg.autoDownload;
    }
    if (cfg.lang) {
      this.lang = cfg.lang;
    }
  }

  checkReleaseOrDownload() {
    const { version, release_note_url } = this.updateInfo;
    const currentVersion = app.getVersion();
    const isLastestVersion = compareVersion(currentVersion, version) >= 0;
    if (isLastestVersion) {
      this.isChecking = false;
      return this.emit("update-not-available");
    }

    new Promise((resolve) => {
      if (!release_note_url) resolve();
      let release_url = get_full_release_note_url(
        release_note_url,
        version,
        this.lang
      );
      https
        .get(release_url, (res) => {
          if (res.statusCode !== 200) {
            resolve();
          } else {
            let release_note = "";
            res
              .on("data", (chunk) => {
                release_note += chunk.toString();
              })
              .on("end", () => {
                if (release_note) {
                  this.updateInfo.release_note = release_note;
                }
                resolve();
              });
          }
        })
        .on("error", () => {
          resolve();
        });
    }).then(() => {
      this.isChecking = false;
      this.emit("update-available", this.updateInfo);

      if (!this.autoDownload) return;
      this.download();
    });
  }

  async download() {
    if (this.isDownloading) return;
    const { version, package_urls, files } = this.updateInfo;
    this.tempFile = path.join(app.getPath("temp"), version + "-app.asar");
    this.isDownloading = true;
    if (fs.existsSync(this.tempFile)) {
      this.isDownloading = false;
      this.emit("update-downloaded");
      return;
    }

    if (fs.existsSync(this.tempFile + ".download")) {
      fs.unlinkSync(this.tempFile + ".download");
    }

    let download_url = "";
    try {
      download_url = await getFasterUrl(
        package_urls.map((u) => get_full_server_url(u, version, files[0]))
      );
    } catch (e) {
      this._emitError(
        new Error("update-download-failed: Failed to get download resource")
      );
    }

    https
      .get(download_url, (response) => {
        if (response.statusCode == 200) {
          const total = response.headers["content-length"];
          let current = 0;

          var ws = fs.createWriteStream(this.tempFile + ".download", {
            flags: "a+",
          });

          const throttledEmit = throttle((total, current) => {
            this.emit("download-progress", {
              total,
              current,
            });
          }, 1000);

          response
            .on("data", (chunk) => {
              current += chunk.length;
              throttledEmit(total, current);
            })
            .on("end", () => {
              throttledEmit(total, current);
            })
            .pipe(ws);

          ws.on("close", () => {
            const rs = fs.createReadStream(this.tempFile + ".download");
            crc64.crc64Stream(rs, (err, crc64ecma) => {
              this.isDownloading = false;
              if (err) {
                this._emitError(
                  new Error("update-download-failed: " + err.message)
                );
              } else {
                const xOssHashCrc64ecma =
                  response.headers["x-oss-hash-crc64ecma"];
                if (xOssHashCrc64ecma === crc64ecma) {
                  moveFile(
                    this.tempFile + ".download",
                    this.tempFile,
                    (err) => {
                      if (err) {
                        this._emitError(err);
                      } else {
                        this.emit("update-downloaded");
                      }
                    }
                  );
                } else {
                  this._emitError(
                    new Error(
                      "update-download-failed: " +
                        `HashCrc64ecma mismatch, file crc64 hash should be ${xOssHashCrc64ecma}, but we got: ${crc64ecma}`
                    )
                  );
                }
              }
            });
          });
        } else {
          this._emitError(
            new Error("update-download-failed: " + response.statusCode)
          );
        }
      })
      .on("error", (e) => {
        this._emitError(e);
      });
  }

  _emitError(error) {
    this.isChecking = false;
    this.isDownloading = false;
    this.emit("error", error.message);
  }
}

const autoUpdater = new AutoUpdater();

exports.autoUpdater = autoUpdater;

const { app, dialog } = require("electron");
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
 * 下载文件，优先增量更新
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

function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
}

/**
 * 使用 asar 包情况，在 Windows 系统里 Electron 应用启动后 node 文件和 app.asar 都会被占用，不能直接修改和删除，必须结束 Electron 应用的进程后才可以替换这些文件。
 * 不使用 asar 包的情况，如果没有 C++ 原生模块可以直接替换 app 目录里的文件，如果存在同理不能直接替换。
 */

function moveFile(from, to, fn) {
  if (typeof fn !== "function") {
    return new Promise((resolve, reject) => {
      moveFile(from, to, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 如果to是 /a/b/c/d.js 这种嵌套层级时，确保该文件夹存在
  mkdirsSync(path.dirname(to));

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
    this.tempFiles = [];

    this.isChecking = false;
    this.isDownloading = false;

    this.updateInfo = null;
    this.downloadInfo = null;

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
    if (
      this.isChecking ||
      this.isDownloading ||
      !this.tempFiles.length ||
      this.tempFiles.some((f) => !fs.existsSync(f.from))
    ) {
      return;
    }

    process.noAsar = true;
    Promise.all(this.tempFiles.map((info) => moveFile(info.from, info.to)))
      .then(() => {
        app.relaunch();
        app.exit(0);
      })
      .catch((e) => {
        dialog.showErrorBox("Update Error", JSON.stringify(e));
        fs.writeFileSync(
          path.join(app.getPath("userData"), "upgrade-error.txt"),
          JSON.stringify(e)
        );
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
    this.downloadInfo = {
      current: 0,
      total: 0,
      details: {},
    };
    this.isDownloading = true;
    const { files, version } = this.updateInfo;
    this.tempFiles = files.map((f) => {
      return {
        originName: f,
        from: path.join(
          app.getPath("temp"),
          version + "-" + f.replace("/", "%2F")
        ),
        to: path.join(path.dirname(__dirname), f),
      };
    });
    let timer;
    try {
      timer = setInterval(() => {
        this.emit("download-progress", this.downloadInfo);
      }, 1000);
      await Promise.all(
        this.tempFiles.map((file) => this.downloadSingleFile(file))
      );
    } catch (e) {
      this._emitError(e);
    }
    clearInterval(timer);
    this.isDownloading = false;
    this.emit("update-downloaded");
  }

  downloadSingleFile(file) {
    return new Promise((resolve, reject) => {
      const { version, package_urls } = this.updateInfo;
      const tempFile = file.from;
      if (fs.existsSync(tempFile)) {
        return resolve();
      }

      if (fs.existsSync(tempFile + ".download")) {
        fs.unlinkSync(tempFile + ".download");
      }

      getFasterUrl(
        package_urls.map((u) =>
          get_full_server_url(u, version, file.originName)
        )
      )
        .then((download_url) => {
          https
            .get(download_url, (response) => {
              if (response.statusCode == 200) {
                let total = +response.headers["content-length"];
                this.updateDownloadInfo("total", total, file.originName);
                let current = 0;

                var ws = fs.createWriteStream(tempFile + ".download", {
                  flags: "a+",
                });

                const throttledEmit = throttle((current) => {
                  this.updateDownloadInfo("progress", current, file.originName);
                }, 1000);

                response
                  .on("data", (chunk) => {
                    current += chunk.length;
                    throttledEmit(current);
                  })
                  .on("end", () => {
                    throttledEmit(total);
                  })
                  .pipe(ws);

                ws.on("close", () => {
                  const rs = fs.createReadStream(tempFile + ".download");
                  crc64.crc64Stream(rs, (err, crc64ecma) => {
                    if (err) {
                      reject(
                        new Error("update-download-failed: " + err.message)
                      );
                    } else {
                      const xOssHashCrc64ecma =
                        response.headers["x-oss-hash-crc64ecma"];
                      if (xOssHashCrc64ecma === crc64ecma) {
                        moveFile(tempFile + ".download", tempFile, (err) => {
                          if (err) {
                            reject(err);
                          } else {
                            resolve();
                          }
                        });
                      } else {
                        reject(
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
                reject(
                  new Error("update-download-failed: " + response.statusCode)
                );
              }
            })
            .on("error", (e) => {
              reject(e);
            });
        })
        .catch(() => {
          reject(
            new Error("update-download-failed: Failed to get download resource")
          );
        });
    });
  }

  updateDownloadInfo(type, payload, filename) {
    if (!this.downloadInfo) {
      this.downloadInfo = { total: 0, current: 0, details: {} };
    }
    const { details } = this.downloadInfo;
    if (filename && !details[filename]) {
      details[filename] = { total: 0, current: 0 };
    }
    switch (type) {
      case "total":
        details[filename].total = payload;
        this.downloadInfo.total = Object.keys(details).reduce(
          (total, key) => total + details[key].total,
          0
        );
        break;
      case "progress":
        details[filename].current = payload;
        this.downloadInfo.current = Object.keys(details).reduce(
          (current, key) => current + details[key].current,
          0
        );
        break;
      default: {
        return;
      }
    }
  }

  _emitError(error) {
    this.isChecking = false;
    this.isDownloading = false;
    this.emit("error", error.message);
  }
}

const autoUpdater = new AutoUpdater();

exports.autoUpdater = autoUpdater;

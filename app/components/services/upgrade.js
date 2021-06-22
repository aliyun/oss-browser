angular.module("web").factory("updateSvs", [
  "$rootScope",
  "settingsSvs",
  function ($rootScope, settingsSvs) {
    const { ipcRenderer } = require("electron");

    return {
      checkForUpdate,
      startDownload,
      quitAndInstall,
    };

    function checkForUpdate(cb) {
      ipcRenderer.removeAllListeners("update-available");
      ipcRenderer.removeAllListeners("update-not-available");
      ipcRenderer.removeAllListeners("download-progress");
      ipcRenderer.removeAllListeners("update-downloaded");
      ipcRenderer.removeAllListeners("update-error");

      ipcRenderer.once("update-available", (event, info) => {
        console.log("[update-available]:当前最新版本是", info.version);
        cb({
          isLastVersion: false,
          lastVersion: info.version,
          lastReleaseNote: info.release_note,
          link: info.link,
          files: info.files,
          status: "ready",
        });
      });
      ipcRenderer.once("update-not-available", () => {
        console.log("[update-not-available]:当前是最新版本！");
        cb({
          status: "finished",
        });
      });
      ipcRenderer.on("download-progress", (event, info) => {
        cb({
          isLastVersion: false,
          status: "running",
          total: info.total,
          current: info.current,
        });
      });
      ipcRenderer.once("update-downloaded", () => {
        cb({
          isLastVersion: false,
          status: "finished",
        });
      });
      ipcRenderer.once("update-error", (event, msg) => {
        console.log("[update-error]:", msg);
        cb({
          isLastVersion: false,
          status: "failed",
          errorMsg: msg,
        });
      });

      ipcRenderer.send("check-for-update", {
        autoDownload: settingsSvs.autoUpgrade.get() == 1,
        lang: $rootScope.langSettings.lang,
      });
      cb({
        status: "checking",
      });
    }
    function startDownload() {
      ipcRenderer.send("update-start-download");
    }
    function quitAndInstall() {
      ipcRenderer.send("quit-and-install");
    }
  },
]);

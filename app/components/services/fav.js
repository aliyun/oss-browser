angular.module("web").factory("Fav", [
  "$q",
  "AuthInfo",
  "Toast",
  function ($q, AuthInfo, Toast) {
    var MAX = 100;
    var fs = require("fs");
    var path = require("path");
    var os = require("os");

    return {
      add: add,
      list: list,
      remove: remove,
      has: has,
    };
    function has(addr) {
      var arr = list();
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].url == addr) {
          return true;
        }
      }
      return false;
    }

    function add(addr) {
      var arr = list();

      if (arr.length >= MAX) return false;
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].url == addr) {
          arr.splice(i, 1);
          i--;
        }
      }
      arr.push({ url: addr, time: new Date().getTime() });
      if (arr.length > MAX) {
        arr.splice(MAX, arr.length - MAX);
      }
      //localStorage.setItem('favs',JSON.stringify(arr));
      save(arr);
      return true;
    }

    function remove(addr) {
      var arr = list();
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].url == addr) {
          arr.splice(i, 1);
          i--;
        }
      }
      //localStorage.setItem('favs',JSON.stringify(arr));
      save(arr);
    }

    function save(arr) {
      try {
        fs.writeFileSync(getFavFilePath(), JSON.stringify(arr));
      } catch (e) {
        Toast.error("保存书签失败:" + e.message);
      }
    }

    function list() {
      try {
        var data = fs.readFileSync(getFavFilePath());
        return JSON.parse(data ? data.toString() : "[]");
        // var arr = JSON.parse(localStorage.getItem('favs')||'[]');
        // return arr;
      } catch (e) {
        return [];
      }
    }

    //下载进度保存路径
    function getFavFilePath() {
      var folder = path.join(os.homedir(), ".oss-browser");
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
      }
      var username = AuthInfo.get().id || "";
      return path.join(folder, "fav_" + username + ".json");
    }
  },
]);

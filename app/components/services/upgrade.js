angular.module("web").factory("upgradeSvs", [
  function () {
    var NAME = Global.app.id || "oss-browser";

    var release_notes_url = Global.release_notes_url;
    var upgrade_url = Global.upgrade_url;
    var gVersion = Global.app.version;

    return {
      load: load,

      compareVersion: compareVersion,
      getReleaseNote: getReleaseNote,
      getLastestReleaseNote: getLastestReleaseNote,
    };

    function getReleaseNote(version, fn) {
      $.get("release-notes/" + version + ".md", fn);
    }

    //获取最新releaseNote
    function getLastestReleaseNote(version, fn) {
      // var ind = upgrade_url.lastIndexOf('aliyun/oss-browser');
      // if(ind>0){
      //   var pre = upgrade_url.substring(0, 'aliyun/oss-browser'.length+ind);
      //   $.get(pre + '/master/release-notes/'+version+'.md', fn);
      // }
      if (!release_notes_url) {
        fn("");
        return;
      }
      $.get(release_notes_url + version + ".md", fn);
    }

    function load(fn) {
      if (!upgrade_url) {
        fn({
          currentVersion: Global.app.version,
          isLastVersion: true,
          lastVersion: Global.app.version,
          fileName: "",
          link: "",
        });
        return;
      }

      $.getJSON(upgrade_url, function (data) {
        var isLastVersion = compareVersion(gVersion, data.version) >= 0;
        var lastVersion = data.version;

        var fileName =
          NAME + "-" + process.platform + "-" + process.arch + ".zip";
        var link =
          data["package_url"].replace(/(\/*$)/g, "") +
          "/" +
          data["version"] +
          "/" +
          fileName;
        console.log("download url:", link);

        fn({
          currentVersion: gVersion,
          isLastVersion: isLastVersion,
          lastVersion: lastVersion,
          fileName: fileName,
          link: link,
        });
      });
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

    function getUpgradeFileName() {
      if (process.platform == "darwin") {
        return NAME + ".dmg";
      } else {
        return NAME + "-" + process.platform + "-" + process.arch + ".zip";
      }

      // if ((navigator.platform == "Win32") || (navigator.platform == "Windows")) {
      //   return NAME + '-'+process.platform+'-'+process.arch+'.zip';
      // } else if ((navigator.platform == "Mac68K") || (navigator.platform == "MacPPC") || (navigator.platform == "Macintosh") || (navigator.platform == "MacIntel")) {
      //   return NAME + '.dmg';
      //   //return NAME + '-darwin-x64.zip';
      // } else {
      //   return NAME + '-linux-x64.zip';
      // }
    }
  },
]);

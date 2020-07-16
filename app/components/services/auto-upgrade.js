angular.module("web").factory("autoUpgradeSvs", [
  "settingsSvs",
  function () {
    return {
      compareVersion: compareVersion,
    };

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
  },
]);

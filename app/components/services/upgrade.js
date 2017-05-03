angular.module('web')
  .factory('upgradeSvs', [function () {

    var NAME = 'oss-browser';

    return {
      load: load,

      compareVersion: compareVersion
    };

    function load(fn) {

      $.getJSON(pkg.upgrade_url, function (data) {

        var isLastVersion = compareVersion(pkg.version, data.version) >= 0;
        var lastVersion = data.version;
        var fileName = getUpgradeFileName();
        var link = data['package_url'].replace(/(\/*$)/g, '') +
          '/' + data['version'] + '/' + fileName;
        fn({
          currentVersion: pkg.version,
          isLastVersion: isLastVersion,
          lastVersion: lastVersion,
          fileName: fileName,
          link: link
        })
      });
    }

    function compareVersion(curV, lastV) {
      var arr = curV.split('.');
      var arr2 = lastV.split('.');

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
      if ((navigator.platform == "Win32") || (navigator.platform == "Windows")) {
        return NAME + '-win32-x64.zip';
      } else if ((navigator.platform == "Mac68K") || (navigator.platform == "MacPPC") || (navigator.platform == "Macintosh") || (navigator.platform == "MacIntel")) {
        return NAME + '-darwin-x64.zip';
      } else {
        return NAME + '-linux-x64.zip';
      }
    }

  }]);
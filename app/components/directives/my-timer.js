angular.module("web").directive("myTimer", [
  "$timeout",
  "utilSvs",
  function ($timeout, utilSvs) {
    return {
      link: linkFn,
      restrict: "EA",
      transclude: false,
      scope: {
        expiration: "=",
      },
    };

    function linkFn(scope, ele, attr) {
      _dig();

      function _dig() {
        go();
        $timeout(_dig, 1000);
      }

      function go() {
        var s = Date.parse(scope.expiration) - Date.now();
        ele.html(utilSvs.leftTime(s));
      }
    }
  },
]);

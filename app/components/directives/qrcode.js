angular.module("web").directive("qrcode", [
  "$timeout",
  function ($timeout) {
    return {
      link: linkFn,
      restrict: "EA",
      transclude: true,
      template:
        '<div class="qrcode"><div></div></div><ng-transclude></ng-transclude>',
      scope: {
        text: "=",
        width: "=",
        height: "=",
        label: "=",
      },
    };

    function linkFn(scope, ele, attr) {
      scope.$watch("text", function (v) {
        reset(v);
      });

      function reset(v) {
        var w = scope.width || scope.height || 100;
        var h = scope.height || scope.width || 100;
        $(ele).find(".qrcode").html("<div></div>");
        if (v)
          $($(ele).find(".qrcode>div")).qrcode({
            text: v || "",
            width: w,
            height: h,
          });
      }
    }
  },
]);

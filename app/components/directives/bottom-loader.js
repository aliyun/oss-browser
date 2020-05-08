angular.module("web").directive("bottomLoader", [
  "$timeout",
  function ($timeout) {
    return {
      link: linkFn,
      restrict: "EA",
      transclude: false,
      scope: {
        bottomLoader: "&",
      },
    };

    function linkFn(scope, ele, attr) {
      ele.css({
        //'border-bottom': '1px solid red',
        overflow: "auto",
        position: "relative",
      });
      var tid2;
      function onScroll() {
        $timeout.cancel(tid2);
        tid2 = $timeout(function () {
          if (
            $(ele)[0].scrollHeight > 0 &&
            $(ele).parent().height() + $(ele).scrollTop() + 10 >=
              $(ele)[0].scrollHeight
          ) {
            scope.bottomLoader();
          }
        }, 500);
      }
      onScroll();
      $(window).resize(onScroll);
      $(ele).scroll(onScroll);
    }
  },
]);

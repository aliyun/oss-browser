angular.module("web").directive("autoHeight", [
  "$timeout",
  function ($timeout) {
    return {
      link: linkFn,
      restrict: "EA",
      transclude: false,
      scope: {
        autoHeight: "=",
        //bottomLoader: '&'
      },
    };

    function linkFn(scope, ele, attr) {
      var h = parseInt(scope.autoHeight);

      ele.css({
        //'border-bottom': '1px solid #ccc',
        overflow: "auto",
        position: "relative",
      });

      var tid;

      function resize() {
        $timeout.cancel(tid);
        tid = $timeout(function () {
          var v = $(window).height() + h;
          $(ele).height(v);
        }, 300);
      }

      $(window).resize(resize);
      resize();

      // //////////////////////////////
      // if (scope.bottomLoader) {
      //
      //   var tid2;
      //   function onScroll() {
      //      $timeout.cancel(tid2);
      //      tid2 = $timeout(function () {
      //
      //         if($(ele)[0].scrollHeight>0
      //         && ($(ele).parent().height() +  $(ele).scrollTop() +10 >= $(ele)[0].scrollHeight) ){
      //           scope.bottomLoader();
      //         }
      //      },500);
      //   }
      //
      //   $(window).resize(onScroll);
      //   $(ele).scroll(onScroll);
      // }
    }
  },
]);

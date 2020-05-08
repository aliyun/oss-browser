angular.module("web").directive("longScrollList", [
  "$timeout",
  function ($timeout) {
    return {
      restrict: "EA",
      transclude: true,
      scope: {
        loadMoreFn: "=loadMore",
        triggerSize: "=",
      },
      template: "<div ng-transclude></div>",

      link: function (scope, ele, attr) {
        var t = ele.offset().top;
        var h = $(ele).height();

        var SIZE = scope.triggerSize || 20;

        $(ele).scroll(onScroll);
        //effect();

        var tid;
        function onScroll() {
          $timeout.cancel(tid);
          tid = $timeout(function () {
            effect();
          }, 200);
        }

        function effect() {
          var scrollTop = $(ele).scrollTop();
          var scrollHeight = $(ele)[0].scrollHeight;

          if (scrollTop + h > scrollHeight - SIZE) {
            if (typeof scope.loadMoreFn == "function") scope.loadMoreFn();
          }

          // var arr = $($(ele).find('li.list-group-item'));
          // if(arr.length<SIZE){
          //   $($(ele).find('li.list-group-item')).removeClass('invisible');
          // }
          // else{
          //   arr.each(function(){
          //     var iTop = $(this).offset().top - t;
          //     //console.log(iTop, h, t)
          //     if(iTop < -350 || iTop > h + 350){
          //       $(this).addClass('invisible');
          //     }else{
          //       $(this).removeClass('invisible');
          //     }
          //   });
          // }
        }
      },
    };
  },
]);

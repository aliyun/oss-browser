angular.module('web')
  .directive('dropZone', function () {

    return {
      link: linkFn,
      restrict: 'EA',
      transclude: false,
      scope: {
        dropZone: '='
      }
    };

    function linkFn(scope, ele, attr) {

      var shadow;
      $(ele)
        .on('dragover', function () {

          shadow = $('<div></div>').css({
            position: 'absolute',
            height: $(ele).height(),
            width: $(ele).width(),
            opacity: 0.5,
            top: $(ele).offset().top,
            left: $(ele).offset().left,
            background: 'yellow',
            zIndex: 20,
            boxShadow: 'inset yellow 0 0 10px'
          }).appendTo('body');


          shadow.on('dragleave', function () {
              shadow.remove();
            })
            .on('drop', function (e) {
              shadow.remove();
              scope.dropZone(e);
            });
        });


    }


  });

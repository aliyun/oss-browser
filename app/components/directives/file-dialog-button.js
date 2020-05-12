angular.module("web").directive("fileDialogButton", function () {
  return {
    link: linkFn,
    restrict: "EA",
    transclude: false,
    scope: {
      fileChange: "=",
    },
  };

  function linkFn(scope, ele, attr) {
    $(ele).on("change", function (e) {
      scope.fileChange.call({}, e.target.files);
    });
  }
});

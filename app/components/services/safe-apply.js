angular.module("web").factory("safeApply", [
  function () {
    return function ($scope, fn) {
      if (!$scope.$root) return;
      var phase = $scope.$root.$$phase;
      if (phase == "$apply" || phase == "$digest") {
        if (fn) {
          $scope.$eval(fn);
        }
      } else {
        if (fn) {
          $scope.$apply(fn);
        } else {
          $scope.$apply();
        }
      }
    };
  },
]);

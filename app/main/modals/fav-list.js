"use strict";

angular.module("web").controller("favListCtrl", [
  "$scope",
  "$rootScope",
  "$translate",
  "$state",
  "$uibModalInstance",
  "Fav",
  "Toast",
  function (
    $scope,
    $rootScope,
    $translate,
    $state,
    $modalInstance,
    Fav,
    Toast
  ) {
    var T = $translate.instant;
    angular.extend($scope, {
      cancel: cancel,
      refresh: refresh,
      removeFav: removeFav,
      goTo: goTo,
    });

    refresh();
    function refresh() {
      var arr = Fav.list();
      $scope.items = arr;
    }

    function goTo(url) {
      $rootScope.$broadcast("goToOssAddress", url);
      cancel();
    }

    function cancel() {
      $modalInstance.dismiss("close");
    }

    function removeFav(item) {
      Fav.remove(item.url);
      Toast.warning(T("bookmarks.delete.success")); //删除书签成功
      refresh();
    }
  },
]);

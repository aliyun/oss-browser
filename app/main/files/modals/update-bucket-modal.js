angular.module("web").controller("updateBucketModalCtrl", [
  "$scope",
  "$uibModalInstance",
  "$translate",
  "item",
  "callback",
  "ossSvs2",
  "safeApply",
  "Const",
  "Dialog",
  function (
    $scope,
    $modalInstance,
    $translate,
    item,
    callback,
    ossSvs2,
    safeApply,
    Const,
    Dialog
  ) {
    var T = $translate.instant;
    var bucketACL = angular.copy(Const.bucketACL);
    var regions = angular.copy(Const.regions);

    angular.extend($scope, {
      bucketACL: [], //angular.copy(Const.bucketACL),
      //regions: angular.copy(Const.regions),
      onAclChanged: onAclChanged,
      cancel: cancel,
      onSubmit: onSubmit,
      item: item,
    });

    i18nBucketACL();

    function i18nBucketACL() {
      var arr = angular.copy(Const.bucketACL);
      angular.forEach(arr, function (n) {
        n.label = T("aclType." + n.acl);
      });
      $scope.bucketACL = arr;
    }

    function onAclChanged() {
      if ($scope.item.acl !== "private") {
        let message = T("acl.warn-not-private." + $scope.item.acl);
        Dialog.alert("", message);
      }
    }

    ossSvs2.getBucketACL(item.region, item.name).then(function (result) {
      $scope.item.acl = result.acl;
      safeApply($scope);
    });

    function cancel() {
      $modalInstance.dismiss("cancel");
    }

    function onSubmit(form) {
      if (!form.$valid) return;
      var item = angular.copy($scope.item);

      ossSvs2
        .updateBucketACL(item.region, item.name, item.acl)
        .then(function (result) {
          callback();
          cancel();
        });
    }
  },
]);

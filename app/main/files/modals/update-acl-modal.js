angular.module("web").controller("updateACLModalCtrl", [
  "$scope",
  "$uibModalInstance",
  "$translate",
  "item",
  "currentInfo",
  "ossSvs2",
  "Toast",
  "safeApply",
  function (
    $scope,
    $modalInstance,
    $translate,
    item,
    currentInfo,
    ossSvs2,
    Toast,
    safeApply
  ) {
    var T = $translate.instant;

    angular.extend($scope, {
      currentInfo: currentInfo,
      item: item,
      cancel: cancel,
      onSubmit: onSubmit,
      info: {
        acl: "default",
      },
    });

    const options =
      item.versionId === undefined ? undefined : { versionId: item.versionId };
    ossSvs2
      .getACL(currentInfo.region, currentInfo.bucket, item.path, options)
      .then(function (res) {
        $scope.info.acl = res.acl || "default";
        safeApply($scope);
      });

    function cancel() {
      $modalInstance.dismiss("close");
    }

    function onSubmit(form) {
      if (!form.$valid) return;
      var acl = $scope.info.acl;
      ossSvs2
        .updateACL(
          currentInfo.region,
          currentInfo.bucket,
          item.path,
          acl,
          options
        )
        .then(function () {
          Toast.success(T("acl.update.success")); //'修改ACL权限成功'
          cancel();
        });
    }
  },
]);

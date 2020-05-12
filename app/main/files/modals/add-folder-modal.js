angular.module("web").controller("addFolderModalCtrl", [
  "$scope",
  "$uibModalInstance",
  "currentInfo",
  "callback",
  "ossSvs2",
  function ($scope, $modalInstance, currentInfo, callback, ossSvs2) {
    angular.extend($scope, {
      currentInfo: currentInfo,
      item: {},
      cancel: cancel,
      onSubmit: onSubmit,
      reg: {
        folderName: /^[^\/]+$/,
      },
    });

    function cancel() {
      $modalInstance.dismiss("close");
    }

    function onSubmit(form) {
      if (!form.$valid) return;

      var folderName = $scope.item.name;

      ossSvs2
        .createFolder(
          currentInfo.region,
          currentInfo.bucket,
          currentInfo.key + folderName + "/"
        )
        .then(function () {
          callback();
          cancel();
        });
    }
  },
]);

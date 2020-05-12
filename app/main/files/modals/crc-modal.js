angular.module("web").controller("crcModalCtrl", [
  "$scope",
  "$q",
  "$uibModalInstance",
  "item",
  "currentInfo",
  "ossSvs2",
  "safeApply",
  function ($scope, $q, $modalInstance, item, currentInfo, ossSvs2, safeApply) {
    angular.extend($scope, {
      item: item,
      info: {},
      currentInfo: currentInfo,
      openDoc: openDoc,
      cancel: cancel,
    });

    function cancel() {
      $modalInstance.dismiss("close");
    }

    function openDoc() {
      openExternal("https://help.aliyun.com/document_detail/43394.html");
    }

    init();

    function init() {
      ossSvs2
        .getFileInfo(currentInfo.region, currentInfo.bucket, item.path)
        .then(function (data) {
          $scope.info = data;
          safeApply($scope);
        });
    }
  },
]);

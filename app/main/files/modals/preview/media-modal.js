angular.module("web").controller("mediaModalCtrl", [
  "$scope",
  "$uibModalInstance",
  "$timeout",
  "$sce",
  "$uibModal",
  "ossSvs2",
  "safeApply",
  "showFn",
  "bucketInfo",
  "objectInfo",
  "fileType",
  function (
    $scope,
    $modalInstance,
    $timeout,
    $sce,
    $modal,
    ossSvs2,
    safeApply,
    showFn,
    bucketInfo,
    objectInfo,
    fileType
  ) {
    angular.extend($scope, {
      bucketInfo: bucketInfo,
      objectInfo: objectInfo,
      fileType: fileType,
      afterCheckSuccess: afterCheckSuccess,
      afterRestoreSubmit: afterRestoreSubmit,

      previewBarVisible: false,
      showFn: showFn,
      cancel: cancel,

      MAX_SIZE: 5 * 1024 * 1024, //5MB
    });

    function afterRestoreSubmit() {
      showFn.callback(true);
    }

    function afterCheckSuccess() {
      $scope.previewBarVisible = true;
      genURL();
    }

    function cancel() {
      $modalInstance.dismiss("close");
    }

    function genURL() {
      var url = ossSvs2.signatureUrl2(
        bucketInfo.region,
        bucketInfo.bucket,
        objectInfo.path,
        3600
      );
      $timeout(function () {
        $scope.src_origin = url;
        $scope.src = $sce.trustAsResourceUrl(url);

        $timeout(function () {
          var ele = $("#video-player");
          if (parseInt(ele.css("height")) > parseInt(ele.css("width"))) {
            ele.css("height", $(document).height() - 240);
            ele.css("width", "auto");
          }
        }, 1000);
      }, 300);
    }
  },
]);

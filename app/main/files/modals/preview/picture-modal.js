angular.module("web").controller("pictureModalCtrl", [
  "$scope",
  "$uibModalInstance",
  "$timeout",
  "$uibModal",
  "ossSvs2",
  "safeApply",
  "showFn",
  "bucketInfo",
  "objectInfo",
  "AuthInfo",
  "fileType",
  function (
    $scope,
    $modalInstance,
    $timeout,
    $modal,
    ossSvs2,
    safeApply,
    showFn,
    bucketInfo,
    objectInfo,
    AuthInfo,
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
      getContent();
    }

    function cancel() {
      $modalInstance.dismiss("close");
    }

    function getContent() {
      var info = AuthInfo.get();
      if (info.id.indexOf("STS.") == 0) {
        ossSvs2
          .getImageBase64Url(
            bucketInfo.region,
            bucketInfo.bucket,
            objectInfo.path
          )
          .then(function (data) {
            if (data.ContentType.indexOf("image/") == 0) {
              var base64str = new Buffer(data.Body).toString("base64");
              $scope.imgsrc =
                "data:" + data.ContentType + ";base64," + base64str;
            }
          });
      } else {
        var process = "image/quality,q_10";
        var url = ossSvs2.signatureUrl(
          bucketInfo.region,
          bucketInfo.bucket,
          objectInfo.path
        );
        var url5M = ossSvs2.signatureUrl2(
          bucketInfo.region,
          bucketInfo.bucket,
          objectInfo.path,
          3600,
          process
        );
        $timeout(function () {
          if (objectInfo.size < $scope.MAX_SIZE) {
            $scope.imgsrc = url;
          } else {
            $scope.imgsrc = url5M;
          }
        }, 300);
      }
    }
  },
]);

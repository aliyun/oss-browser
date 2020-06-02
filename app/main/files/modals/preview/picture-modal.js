angular.module("web").controller("pictureModalCtrl", [
  "$scope",
  "$uibModalInstance",
  "$timeout",
  "$uibModal",
  "ossSvs2",
  "safeApply",
  "showFn",
  "showStatus",
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
    showStatus,
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
      showStatus,
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
          .getContent(
            bucketInfo.region,
            bucketInfo.bucket,
            $scope.objectInfo.path,
            $scope.objectInfo.versionId
          )
          .then(function (data) {
            if (data.ContentType.indexOf("image/") == 0) {
              var base64str = new Buffer(data.Body).toString("base64");
              $scope.imgsrc =
                "data:" + data.ContentType + ";base64," + base64str;
            }
          });
      } else {
        const options = {};
        if ($scope.objectInfo.versionId !== undefined) {
          options.subResource = {
            versionId: $scope.objectInfo.versionId,
          };
        }
        if ($scope.objectInfo.size < $scope.MAX_SIZE) {
          options.expires = 60;
        } else {
          options.expires = 3600;
          options.process = "image/quality,q_10";
        }
        console.log(options);
        $scope.imgsrc = ossSvs2.signatureUrl2(
          bucketInfo.region,
          bucketInfo.bucket,
          $scope.objectInfo.path,
          options
        );
      }
    }
  },
]);

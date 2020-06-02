angular.module("web").controller("docModalCtrl", [
  "$scope",
  "$uibModalInstance",
  "Const",
  "bucketInfo",
  "objectInfo",
  "showFn",
  "showStatus",
  "ossSvs2",
  "fileType",
  function (
    $scope,
    $modalInstance,
    Const,
    bucketInfo,
    objectInfo,
    showFn,
    showStatus,
    ossSvs2,
    fileType
  ) {
    angular.extend($scope, {
      bucketInfo: bucketInfo,
      objectInfo: objectInfo,
      fileType: fileType,
      afterCheckSuccess: afterCheckSuccess,
      afterRestoreSubmit: afterRestoreSubmit,

      openURL: openURL,

      previewBarVisible: false,
      showFn: showFn,
      showStatus,
      cancel: cancel,

      MAX_SIZE: 50 * 1024 * 1024, //50MB
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

    function openURL(v) {
      openExternal(v);
    }

    function getContent() {
      const options = {
        expires: 3600,
      };
      if (objectInfo.versionId !== undefined) {
        options.subResource = {
          versionId: objectInfo.versionId,
        };
      }
      if (fileType.ext[0] == "pdf") {
        $scope.prevUrl = ossSvs2.signatureUrl2(
          bucketInfo.region,
          bucketInfo.bucket,
          objectInfo.path,
          options
        );
        return;
      }

      options.process = "imm/previewdoc,copy_1";
      var prevUrl = ossSvs2.signatureUrl2(
        bucketInfo.region,
        bucketInfo.bucket,
        objectInfo.path,
        options
      );
      //console.log(prevUrl)
      $.ajax({
        url: prevUrl,
        success: function () {
          $scope.prevUrl = prevUrl;
        },
        error: function (err) {
          if (err.responseJSON) {
            if (err.responseJSON.code == "InvalidProject.NotFound") {
              $scope.error = err.responseText;
              $scope.doc_link = Const.IMM_DOC_PREVIEW_LINK;
            } else {
              $scope.error = err.responseText;
            }
          } else {
            $scope.error = err.responseText;
          }
        },
      });
    }
  },
]);

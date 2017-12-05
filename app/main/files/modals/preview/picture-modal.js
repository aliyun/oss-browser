angular.module('web')
  .controller('pictureModalCtrl', ['$scope', '$uibModalInstance', '$timeout', '$uibModal', 'ossSvs2', 'safeApply', 'showFn', 'bucketInfo', 'objectInfo','AuthInfo', 'fileType',
    function ($scope, $modalInstance, $timeout, $modal, ossSvs2, safeApply, showFn, bucketInfo, objectInfo, AuthInfo, fileType) {

      angular.extend($scope, {
        bucketInfo: bucketInfo,
        objectInfo: objectInfo,
        fileType: fileType,
        afterCheckSuccess: afterCheckSuccess,
        afterRestoreSubmit: afterRestoreSubmit,

        previewBarVisible: false,
        showFn: showFn,
        cancel: cancel,

        MAX_SIZE: 5 * 1024 * 1024 //5MB
      });

      function afterRestoreSubmit() {
        showFn.callback(true);
      }

      function afterCheckSuccess() {
        $scope.previewBarVisible = true;
        if (objectInfo.size < $scope.MAX_SIZE) {
          getContent();
        }
      }

      function cancel() {
        $modalInstance.dismiss('close');
      }

      function getContent() {
        var info  = AuthInfo.get();
        if(info.id.indexOf('STS.')==0){
          ossSvs2.getImageBase64Url(bucketInfo.region, bucketInfo.bucket, objectInfo.path).then(function(data){
            if(data.ContentType.indexOf('image/')==0){
              var base64str = new Buffer(data.Body).toString('base64');
              $scope.imgsrc = 'data:'+data.ContentType+';base64,'+base64str;
            }
          })
        }
        else{
          var url = ossSvs2.signatureUrl(bucketInfo.region, bucketInfo.bucket, objectInfo.path);
          $timeout(function () {
            $scope.imgsrc = url;
          }, 300);
        }

      }

    }
  ]);

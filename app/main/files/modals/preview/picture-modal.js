angular.module('web')
  .controller('pictureModalCtrl', ['$scope','$uibModalInstance','$timeout','showFn','bucketInfo','objectInfo','fileType','ossSvs',
    function ($scope, $modalInstance, $timeout, showFn, bucketInfo, objectInfo, fileType, ossSvs) {

      angular.extend($scope, {
        bucketInfo: bucketInfo,
        objectInfo: objectInfo,
        fileType: fileType,

        showFn: showFn,

        cancel: cancel,
        MAX_SIZE: 5*1024*1024  //5MB
      });

      if(objectInfo.size < $scope.MAX_SIZE){
        getContent();
      }

      function cancel() {
        $modalInstance.dismiss('close');
      }


      function getContent(){
        var url = ossSvs.signatureUrl(bucketInfo.region, bucketInfo.bucket, objectInfo.path);
        $timeout(function(){
          $scope.imgsrc = url;
        },300);
      }



    }])
;

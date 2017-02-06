angular.module('web')
  .controller('docModalCtrl', ['$scope','$uibModalInstance','bucketInfo','objectInfo','fileType','ossSvs',
    function ($scope, $modalInstance, bucketInfo, objectInfo, fileType, ossSvs) {

      angular.extend($scope, {
        bucketInfo: bucketInfo,
        objectInfo: objectInfo,
        fileType: fileType,

        cancel: cancel
      });

      function cancel() {
        $modalInstance.dismiss('close');
      }


    }])
;

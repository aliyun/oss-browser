angular.module('web')
  .controller('docModalCtrl', ['$scope','$uibModalInstance','bucketInfo','objectInfo','fileType',
    function ($scope, $modalInstance, bucketInfo, objectInfo, fileType) {

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

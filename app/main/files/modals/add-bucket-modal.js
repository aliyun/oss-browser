angular.module('web')
  .controller('addBucketModalCtrl', ['$scope','$uibModalInstance','callback','ossSvs','Const',
    function ($scope, $modalInstance, callback, ossSvs, Const) {

      var bucketACL= angular.copy(Const.bucketACL);
      var regions= angular.copy(Const.regions);

      angular.extend($scope, {
        bucketACL: angular.copy(Const.bucketACL),
        regions: angular.copy(Const.regions),
        cancel: cancel,
        onSubmit: onSubmit,
        item: {
          acl: bucketACL[0].acl,
          region: regions[0].id
        }
      });

      function cancel() {
        $modalInstance.dismiss('cancel');
      }

      function onSubmit(form) {
        if (!form.$valid) return;
        var item = angular.copy($scope.item);

        ossSvs.createBucket(item.region, item.name, item.acl).then(function(result){
           callback();
           cancel();
        });
      }
    }])
;

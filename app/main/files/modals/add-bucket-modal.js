angular.module('web')
  .controller('addBucketModalCtrl', ['$scope','$uibModalInstance','callback','ossSvs2','Const',
    function ($scope, $modalInstance, callback, ossSvs2, Const) {

      var bucketACL= angular.copy(Const.bucketACL);
      var regions= angular.copy(Const.regions);

      angular.extend($scope, {
        bucketACL: angular.copy(Const.bucketACL),
        regions: angular.copy(Const.regions),
        cancel: cancel,
        onSubmit: onSubmit,
        storageClasses: [{value:'Standard',name:'标准类型'},{value:'IA',name:'低频访问类型'},{value:'Archive',name:'归档类型'}],
        item: {
          acl: bucketACL[0].acl,
          region: regions[0].id,
          storageClass: 'Standard'
        }
      });

      function cancel() {
        $modalInstance.dismiss('cancel');
      }

      function onSubmit(form) {
        if (!form.$valid) return;
        var item = angular.copy($scope.item);

        ossSvs2.createBucket(item.region, item.name, item.acl, item.storageClass).then(function(result){
           callback();
           cancel();
        });
      }
    }])
;

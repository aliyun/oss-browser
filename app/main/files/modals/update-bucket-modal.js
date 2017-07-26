angular.module('web')
  .controller('updateBucketModalCtrl', ['$scope','$uibModalInstance','$translate', 'item','callback','ossSvs2','safeApply','Const',
    function ($scope, $modalInstance, $translate, item, callback, ossSvs2, safeApply, Const) {
      var T = $translate.instant;
      var bucketACL= angular.copy(Const.bucketACL);
      var regions= angular.copy(Const.regions);

      angular.extend($scope, {
        bucketACL: [],//angular.copy(Const.bucketACL),
        //regions: angular.copy(Const.regions),
        cancel: cancel,
        onSubmit: onSubmit,
        item: item
      });

      i18nBucketACL();

      function i18nBucketACL() {
        var arr = angular.copy(Const.bucketACL);
        angular.forEach(arr, function (n) {
          n.label = T('aclType.' + n.acl);
        });
        $scope.bucketACL = arr;
      }

      ossSvs2.getBucketACL(item.region, item.name).then(function(result){
        $scope.item.acl = result.acl;
        safeApply($scope);
      });

      function cancel() {
        $modalInstance.dismiss('cancel');
      }

      function onSubmit(form) {
        if (!form.$valid) return;
        var item = angular.copy($scope.item);

        ossSvs2.updateBucketACL(item.region, item.name, item.acl).then(function(result){
           callback();
           cancel();
        });
      }

    }])
;

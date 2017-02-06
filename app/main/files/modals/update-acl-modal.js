angular.module('web')
  .controller('updateACLModalCtrl', ['$scope','$uibModalInstance','item','currentInfo','ossSvs','Toast',
    function ($scope, $modalInstance, item, currentInfo, ossSvs, Toast) {


      angular.extend($scope, {
        currentInfo: currentInfo,
        item: item,
        cancel: cancel,
        onSubmit: onSubmit,
        info: {
          acl: ''
        }
      });

      ossSvs.getACL(currentInfo.region, currentInfo.bucket, item.path).then(function(res){
        $scope.info.acl = res.acl||'default';
      });

      function cancel() {
        $modalInstance.dismiss('close');
      }

      function onSubmit(form) {
        if (!form.$valid)return;
        var acl = $scope.info.acl;
        ossSvs.updateACL(currentInfo.region, currentInfo.bucket, item.path, acl).then(function(res){
          Toast.success('修改ACL权限成功');
          cancel();
        });

      }
    }])
;

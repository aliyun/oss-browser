'use strict';

angular.module('web')
  .controller('aboutCtrl', ['$scope','$state','$uibModalInstance','upgradeSvs','safeApply','Toast',
  function($scope,$state,$modalInstance,upgradeSvs,safeApply, Toast){
     
    angular.extend($scope, {
      cancel: cancel,
      open: open,
      app_logo: Global.app.logo,
      info: {
        currentVersion: pkg.version
      }
    });
 
    init();
    function init(){ 
      $scope.isLoading=true;
      upgradeSvs.load(function(info){
         $scope.isLoading=false;

         angular.extend($scope.info, info); 

         safeApply($scope);
      });
    }

    function open(a){
      openExternal(a);
    }

    function cancel(){
      $modalInstance.dismiss('close');
    }

  }])
;

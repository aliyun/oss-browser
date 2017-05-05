'use strict';

angular.module('web')
  .controller('settingsCtrl', ['$scope','$state','$uibModalInstance','settingsSvs','Toast',
  function($scope,$state,$modalInstance,settingsSvs,Toast){

    angular.extend($scope, {
      showTab: 3,
      set: {
        maxUploadJobCount: settingsSvs.maxUploadJobCount.get(),
        maxDownloadJobCount: settingsSvs.maxDownloadJobCount.get(),
        showImageSnapshot: settingsSvs.showImageSnapshot.get(),
        historiesLength : settingsSvs.historiesLength.get(),
      },
      onSubmit:onSubmit,
      cancel: cancel
    });

    function onSubmit(form1){
      if(!form1.$valid)return;

      settingsSvs.maxUploadJobCount.set( $scope.set.maxUploadJobCount );
      settingsSvs.maxDownloadJobCount.set( $scope.set.maxDownloadJobCount );
      settingsSvs.showImageSnapshot.set( $scope.set.showImageSnapshot );
      settingsSvs.historiesLength.set( $scope.set.historiesLength );

      Toast.success('保存成功');
       cancel();
    }

    function cancel(){
      $modalInstance.dismiss('close');
    }

  }])
;

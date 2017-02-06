'use strict';

angular.module('web')
  .controller('favListCtrl', ['$scope','$rootScope','$state','$uibModalInstance','Fav','Toast',
  function($scope,$rootScope, $state,$modalInstance,Fav,Toast){

    angular.extend($scope, {

      cancel: cancel,
      refresh: refresh,
      removeFav: removeFav,
      goTo: goTo
    });

    refresh();
    function refresh(){
      var arr  = Fav.list();
      $scope.items = arr;
    }

    function goTo(url){
      $rootScope.$broadcast('goToOssAddress', url);
      cancel();
    }


    function cancel(){
      $modalInstance.dismiss('close');
    }

    function removeFav(item){
      Fav.remove(item.url);
      Toast.warning('删除书签成功');
      refresh();
    }

  }])
;

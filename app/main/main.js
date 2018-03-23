
angular.module('web')
   .controller('mainCtrl',['$scope','$rootScope', '$timeout', '$state', '$q','Const','AuthInfo','autoUpgradeSvs',
    function($scope, $rootScope, $timeout, $state, $q, Const, AuthInfo, autoUpgradeSvs){

      angular.extend($scope, {
        upgradeInfo: {
          files: false,
          currentVersion: Global.app.version,
          isLastVersion: true
        }
      });

      $timeout(function(){
        autoUpgradeSvs.load(function(info){
           angular.extend($scope.upgradeInfo, info)
        })
      },2000)

      $rootScope.internalSupported = false;

      $scope.$on('$stateChangeSuccess', function(){
        var name = $state.current.name;
        if(name!='login'){
          $rootScope.internalSupported = (AuthInfo.get().eptpl||'').indexOf('-internal')!=-1;
        }
      });


      //
      // function init(){
      //   var df = $q.defer();
      //   $.ajax({url:'http://'+(region||'oss-cn-beijing')+'-internal.aliyuncs.com',timeout:2000,error:function(xhr){
      //     isInit=true;
      //     if(xhr.status==403){
      //       $rootScope.internalSupported  = true;
      //     }
      //     df.resolve();
      //   }});
      //   return df.promise;
      // }

   }])
   ;

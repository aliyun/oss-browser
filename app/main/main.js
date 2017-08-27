
angular.module('web')
   .controller('mainCtrl',['$scope','$rootScope', '$state', '$q','Const','AuthInfo',
    function($scope, $rootScope, $state, $q, Const, AuthInfo){
      // var isInit = false;
      //
      // $scope.$on('$stateChangeSuccess', function(){
      //   var name = $state.current.name;
      //   if(name!='login' && !isInit){
      //     init();
      //   }
      // });
      // $rootScope.internalSupported  = false;
      // $scope.netInit = init;
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

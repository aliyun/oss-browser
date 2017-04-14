
angular.module('web')
  .controller('loginCtrl', ['$scope', '$rootScope','Auth','AuthInfo','$location','Const','Dialog','Toast','Cipher',
    function ($scope, $rootScope, Auth, AuthInfo, $location, Const,Dialog, Toast, Cipher) {

      var KEY_REMEMBER = Const.KEY_REMEMBER;
      var SHOW_HIS = Const.SHOW_HIS;
      var regions = angular.copy(Const.regions);

      angular.extend($scope, {
        hideTopNav: 1,
        reg_osspath: /^oss\:\/\/[^\/]+\//,
        regions: regions,
        onSubmit: onSubmit,
        showCleanHistories: showCleanHistories,
        useHis: useHis,
        showRemoveHis: showRemoveHis
      });

      init();
      function init(){
        $scope.remember = localStorage.getItem(KEY_REMEMBER) || 'NO';
        $scope.showHis = localStorage.getItem(SHOW_HIS) || 'NO';
        $scope.item = AuthInfo.getRemember();
        listHistories();

        $scope.$watch('remember',function(v){
          if(v=='NO'){
            AuthInfo.unremember();
            localStorage.setItem(KEY_REMEMBER,'NO');
          }
        });
        $scope.$watch('showHis',function(v){
          localStorage.setItem(SHOW_HIS,v);
        });
      }

      function useHis(h){
        $scope.item.id=h.id;
        $scope.item.secret = h.secret;
        $scope.item.desc = h.desc;
      }
      function showRemoveHis(h){
        Dialog.confirm('删除AK','ID：'+h.id+', 确定删除?',function(b){
          if(b){
            AuthInfo.removeFromHistories(h.id);
            listHistories();
          }
        },1);
      }

      function listHistories(){
        $scope.his = AuthInfo.listHistories();
      }

      function showCleanHistories(){
        Dialog.confirm('清空AK历史','确定?',function(b){
          if(b){
            AuthInfo.cleanHistories();
            listHistories();
            Toast.success('已清空AK历史');
          }
        },1);
      }



      function onSubmit(form1){
    
        if(!form1.$valid)return;

        localStorage.setItem(KEY_REMEMBER,$scope.remember);

        var data = angular.copy($scope.item);
        if($scope.remember=='YES'){
          AuthInfo.remember(data);
        }

        Toast.info('正在登录...', 1000);

        Auth.login(data).then(function(){
          Toast.success('登录成功，正在跳转...', 1000);
          $location.url('/');
        },function(err){
          Toast.error(err.code+':'+err.message);
        });

        return false;
      }

    }])
;

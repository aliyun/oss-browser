
angular.module('web')
  .controller('loginCtrl', ['$scope', '$rootScope','Auth','AuthInfo','$timeout','$location','Const','Dialog','Toast','Cipher',
    function ($scope, $rootScope, Auth, AuthInfo,$timeout, $location, Const,Dialog, Toast, Cipher) {

      var KEY_REMEMBER = Const.KEY_REMEMBER;
      var SHOW_HIS = Const.SHOW_HIS;
      var KEY_AUTHTOKEN = 'key-authtoken';
      var regions = angular.copy(Const.regions);

      angular.extend($scope, {
        gtab: 1,
        flags: {
          remember: 'NO',
          showHis: 'NO'
        },
        hideTopNav: 1,
        reg_osspath: /^oss\:\/\//,
        regions: regions,
        onSubmit: onSubmit,
        showCleanHistories: showCleanHistories,
        useHis: useHis,
        showRemoveHis: showRemoveHis,

        open: open,

        onSubmit2: onSubmit2,
        authTokenChange:authTokenChange
      });

      function open(a){
        openExternal(a);
      }

      var tid;
      function authTokenChange(){
        $timeout.cancel(tid);
        tid=$timeout(function(){
          var authToken = $scope.item.authToken;

          localStorage.setItem(KEY_AUTHTOKEN, authToken);
          var str = Buffer.from(authToken, 'base64').toString();
          try{
            var info = JSON.parse(str);

            if(info.id && info.secret && info.stoken && info.privilege && info.expiration && info.osspath){

               //过期
               try{
                 var d = new Date(info.expiration).getTime();
                 info.isExpired = d <= new Date().getTime();
               }catch(e){

               } 
               $scope.authTokenInfo = info;
            }else if(new Date(info.expiration).getTime() < new Date().getTime()){
               $scope.authTokenInfo = null;
            }
          }catch(e){
             $scope.authTokenInfo = null;
          }
        },600)
      }

      init();
      function init(){
        $scope.flags.remember = localStorage.getItem(KEY_REMEMBER) || 'NO';
        $scope.flags.showHis = localStorage.getItem(SHOW_HIS) || 'NO';
        $scope.item = AuthInfo.getRemember();

        //临时token
        $scope.item.authToken = localStorage.getItem(KEY_AUTHTOKEN) || '';
        authTokenChange();

        listHistories();

        $scope.$watch('flags.remember',function(v){
          if(v=='NO'){
            AuthInfo.unremember();
            localStorage.setItem(KEY_REMEMBER,'NO');
          }
        });

        $scope.$watch('flags.showHis',function(v){
          localStorage.setItem(SHOW_HIS,v);
        });
      }

      function useHis(h){
        angular.extend($scope.item, h);
        // $scope.item.id=h.id;
        // $scope.item.secret = h.secret;
        // $scope.item.desc = h.desc;
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

        localStorage.setItem(KEY_REMEMBER,$scope.flags.remember);

        var data = angular.copy($scope.item);
        delete data.authToken;
        delete data.securityToken;

        if($scope.flags.remember=='YES'){
          AuthInfo.remember(data);
        }

        Toast.info('正在登录中...', 1000);


        Auth.login(data).then(function(){
          if($scope.flags.remember=='YES') AuthInfo.addToHistories(data);
          Toast.success('登录成功，正在跳转...', 1000);
          $location.url('/');
        },function(err){
          Toast.error(err.code+':'+err.message);
        });

        return false;
      }

      //token login
      function onSubmit2(form2){

        if(!form2.$valid)return;


        if(!$scope.authTokenInfo){
          return;
        }

        var data = angular.copy($scope.authTokenInfo);

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


angular.module('web')
  .controller('loginCtrl', ['$scope', '$rootScope', '$translate','Auth','AuthInfo','$timeout','$location','Const','Dialog','Toast','Cipher',
    function ($scope, $rootScope, $translate, Auth, AuthInfo,$timeout, $location, Const, Dialog, Toast, Cipher) {

      var DEF_EP_TPL = 'https://{region}.aliyuncs.com';

      var KEY_REMEMBER = Const.KEY_REMEMBER;
      var SHOW_HIS = Const.SHOW_HIS;
      var KEY_AUTHTOKEN = 'key-authtoken';
      var regions = angular.copy(Const.regions);

      var T = $translate.instant;

      angular.extend($scope, {
        gtab: 1,
        flags: {
          remember: 'NO',
          showHis: 'NO'
        },
        item: {
          eptpl: DEF_EP_TPL,
        },
        eptplType: 'default',

        hideTopNav: 1,
        reg_osspath: /^oss\:\/\//,
        regions: regions,
        onSubmit: onSubmit,
        showCleanHistories: showCleanHistories,
        useHis: useHis,
        showRemoveHis: showRemoveHis,

        open: open,

        onSubmit2: onSubmit2,
        authTokenChange:authTokenChange,

        eptplChange: eptplChange
      });

      $scope.$watch('item.eptpl', function(v){
        $scope.eptplType = (v==DEF_EP_TPL)?'default':'customize';
      });


      function eptplChange(t){
        $scope.eptplType=t;
        console.log(t);
        if(t=='default'){
           $scope.item.eptpl = DEF_EP_TPL;
        }else{
          $scope.item.eptpl ='';
        }
      }

      function open(a){
        openExternal(a);
      }

      var tid;
      function authTokenChange(){
        $timeout.cancel(tid);
        tid=$timeout(function(){
          var authToken = $scope.item.authToken||'';

          localStorage.setItem(KEY_AUTHTOKEN, authToken);

          if(!authToken){
            $scope.authTokenInfo = null;
            return;
          }

          try{
            var str = Buffer.from(authToken, 'base64').toString();
            var info = JSON.parse(str);

            if(info.id && info.secret && info.stoken && info.privilege && info.expiration && info.osspath){

               //过期
               try{
                 var d = new Date(info.expiration).getTime();
                 info.isExpired = d <= new Date().getTime();
               }catch(e){

               }
               $scope.authTokenInfo = info;

               $scope.authTokenInfo.expirationStr = moment(new Date(info.expiration)).format('YYYY-MM-DD HH:mm:ss');

            }else if(new Date(info.expiration).getTime() < new Date().getTime()){
               $scope.authTokenInfo = null;
            }
          }catch(e){
             $scope.authTokenInfo = null;
          }
        },600);
      }

      init();
      function init(){
        $scope.flags.remember = localStorage.getItem(KEY_REMEMBER) || 'NO';
        $scope.flags.showHis = localStorage.getItem(SHOW_HIS) || 'NO';
        angular.extend($scope.item , AuthInfo.getRemember());


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
        var title = T('auth.removeAK.title'); //删除AK
        var message = T('auth.removeAK.message',{id: '<code>'+h.id+'</code>'}); //'ID：'+h.id+', 确定删除?'
        Dialog.confirm(title,message,function(b){
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
        var title = T('auth.clearAKHistories.title'); //清空AK历史
        var message = T('auth.clearAKHistories.message'); //确定?
        var successMessage = T('auth.clearAKHistories.successMessage'); //已清空AK历史
        Dialog.confirm(title, message,function(b){
          if(b){
            AuthInfo.cleanHistories();
            listHistories();
            Toast.success(successMessage);
          }
        },1);
      }



      function onSubmit(form1){

        if(!form1.$valid)return;

        localStorage.setItem(KEY_REMEMBER,$scope.flags.remember);

        var data = angular.copy($scope.item);
        //trim password
        if(data.secret) data.secret = data.secret.trim();

        delete data.authToken;
        delete data.securityToken;

        if($scope.flags.remember=='YES'){
          AuthInfo.remember(data);
        }

        Toast.info(T('logining'), 1000);



        Auth.login(data).then(function(){
          if($scope.flags.remember=='YES') AuthInfo.addToHistories(data);
          Toast.success(T('login.successfully'), 1000);
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

        Toast.info(T('logining'), 1000);//'正在登录...'

        Auth.login(data).then(function(){
          Toast.success(T('login.successfully'), 1000);//'登录成功，正在跳转...'
          $location.url('/');
        },function(err){
          Toast.error(err.code+':'+err.message);
        });

        return false;
      }

    }])
;



angular.module('web')
  .controller('topCtrl', ['$scope', '$rootScope','$uibModal', '$location', '$translate', '$timeout','Dialog','Auth','Const', 'AuthInfo','upgradeSvs','safeApply',
    function ($scope, $rootScope, $modal, $location, $translate, $timeout,Dialog,Auth, Const, AuthInfo, upgradeSvs, safeApply) {

      var fs = require('fs');
      var path = require('path');
      var T = $translate.instant;

      angular.extend($scope, {
        logout: logout,
        showFavList: showFavList,
        showAbout: showAbout,
        showReleaseNote: showReleaseNote,
        upgradeInfo: {
          isLastVersion: true
        },
        click10: click10
      });

      var ctime = 0;
      var tid;
      function click10(){
        ctime++;
        if(ctime > 10){
          console.log('---open dev tool---');
          openDevTools();
        }
        $timeout.cancel(tid);
        tid=$timeout(function(){
          ctime = 0;
        },600);
      }

      $rootScope.app = {};
      angular.extend($rootScope.app, Global.app);


      //$scope.aid = AuthInfo.get().id;
      $scope.authInfo = AuthInfo.get();
      $scope.authInfo.expirationStr = moment(new Date($scope.authInfo.expiration)).format('YYYY-MM-DD HH:mm:ss');

      $timeout(init, 2000);

      function init(){
        $scope.isLoading=true;
        //检查更新
        upgradeSvs.load(function(info){
          $scope.isLoading=false;

          angular.extend($scope.upgradeInfo, info);

          safeApply($scope);
        });
      }


      $rootScope.showSettings = function(){
        $modal.open({
          templateUrl: 'main/modals/settings.html',
          controller: 'settingsCtrl'
        });
      };


      function logout() {
        var title = T('logout');
        var message = T('logout.message');
        Dialog.confirm(title, message, function(b){
          if(b){
            Auth.logout().then(function () {
              $location.url('/login');
            });
          }
        },1);
      }

      function showReleaseNote(){
        var converter = new showdown.Converter();
        fs.readFile(path.join(__dirname, 'release-notes', pkg.version+'.md'), function(err, text){
            if(err){
              console.error(err);
              return;
            }
            text = text + '';
            var html = converter.makeHtml(text);
            var message = T('main.upgration');//'主要更新'
            Dialog.alert(message, html, function(){}, {size:'lg'});
        });
      }

      function showFavList(){
        $modal.open({
          templateUrl: 'main/modals/fav-list.html',
          controller: 'favListCtrl',
          size: 'lg'
        });
      }

      function showAbout(){
        $modal.open({
          templateUrl: 'main/modals/about.html',
          controller: 'aboutCtrl',
          size: 'md'
        });
      }


    }])
;

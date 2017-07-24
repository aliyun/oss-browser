

angular.module('web')
  .controller('topCtrl', ['$scope', '$rootScope','$uibModal', '$location', '$timeout','Dialog','Auth','Const', 'AuthInfo','upgradeSvs','safeApply',
    function ($scope, $rootScope, $modal, $location, $timeout,Dialog,Auth,Const, AuthInfo, upgradeSvs, safeApply) {

      var fs = require('fs');
      var path = require('path');

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

      $rootScope.app = {
        name: Const.APPNAME
      };

      angular.extend($rootScope.app, Global.app);


      //$scope.aid = AuthInfo.get().id;
      $scope.authInfo = AuthInfo.get();

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
        Dialog.confirm('退出','确定要退出?', function(b){
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
            Dialog.alert('主要更新', html, function(){}, {size:'lg'});
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

angular.module('web')
  .controller('moveModalCtrl', ['$scope','$uibModalInstance','items','isCopy','currentInfo', 'callback','ossSvs','Toast','AuthInfo','safeApply',
    function ($scope, $modalInstance, items, isCopy, currentInfo, callback, ossSvs, Toast,AuthInfo, safeApply) {

      var authInfo = AuthInfo.get();


      angular.extend($scope, {
        currentInfo: currentInfo,
        items: items,
        isCopy: isCopy,
        step : 1,

        cancel: cancel,
        start: start,
        stop: stop,


        reg: {
          folderName: /^[^\/]+$/
        },
        ossFsConfig: {
          id: authInfo.id,
          secret: authInfo.secret,
          region: currentInfo.region,
          bucket: currentInfo.bucket,
          key: currentInfo.key
        },
        moveTo: {
          ossPath:'',
          region: ''
        },
        canMove: false
      });

      $scope.originPath = 'oss://'+currentInfo.bucket+'/'+currentInfo.key;

      function stop() {
        //$modalInstance.dismiss('cancel');
        $scope.isStop=true;
        ossSvs.stopCopyFiles();
        callback();
      }

      function cancel(){
        $modalInstance.dismiss('cancel');
      }

      function start() {
        $scope.isStop=false;
        $scope.step = 2;

        var target = ossSvs.parseOSSPath($scope.moveTo.ossPath);
        target.region= $scope.moveTo.region;
        var items = angular.copy($scope.items);

        angular.forEach(items, function(n){
          //n.region = currentInfo.region;
          n.bucket = currentInfo.bucket;
        });

        //复制 or 移动
        ossSvs.copyFiles(currentInfo.region, items, target, function progress(prog){
          //进度
          $scope.progress = angular.copy(prog);
          safeApply($scope);
        }, !isCopy).then(function(terr){
          //结果
          $scope.step = 3;
          $scope.terr = terr;
          callback();
        });
      }
    }])
;

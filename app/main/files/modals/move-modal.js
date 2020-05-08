angular.module("web").controller("moveModalCtrl", [
  "$scope",
  "$uibModalInstance",
  "$timeout",
  "items",
  "isCopy",
  "renamePath",
  "fromInfo",
  "moveTo",
  "callback",
  "ossSvs2",
  "Toast",
  "AuthInfo",
  "safeApply",
  function (
    $scope,
    $modalInstance,
    $timeout,
    items,
    isCopy,
    renamePath,
    fromInfo,
    moveTo,
    callback,
    ossSvs2,
    Toast,
    AuthInfo,
    safeApply
  ) {
    var authInfo = AuthInfo.get();

    angular.extend($scope, {
      renamePath: renamePath,
      fromInfo: fromInfo,
      items: items,
      isCopy: isCopy,
      step: 2,

      cancel: cancel,
      start: start,
      stop: stop,

      // reg: {
      //   folderName: /^[^\/]+$/
      // },
      // ossFsConfig: {
      //   id: authInfo.id,
      //   secret: authInfo.secret,
      //   region: currentInfo.region,
      //   bucket: currentInfo.bucket,
      //   key: currentInfo.key
      // },
      moveTo: {
        region: moveTo.region,
        bucket: moveTo.bucket,
        key: moveTo.key,
      },
      canMove: false,
    });

    //$scope.originPath = 'oss://'+currentInfo.bucket+'/'+currentInfo.key;
    start();

    function stop() {
      //$modalInstance.dismiss('cancel');
      $scope.isStop = true;
      ossSvs2.stopCopyFiles();
    }

    function cancel() {
      $modalInstance.dismiss("cancel");
    }

    function start() {
      $scope.isStop = false;
      $scope.step = 2;

      var target = angular.copy($scope.moveTo);
      var items = angular.copy($scope.items);

      angular.forEach(items, function (n) {
        //n.region = currentInfo.region;
        n.bucket = fromInfo.bucket;
      });

      //console.log(fromInfo.region, items, target, renamePath);

      //复制 or 移动
      ossSvs2
        .copyFiles(
          fromInfo.region,
          items,
          target,
          function progress(prog) {
            //进度
            $scope.progress = angular.copy(prog);
            safeApply($scope);
          },
          !isCopy,
          renamePath
        )
        .then(function (terr) {
          //结果
          $scope.step = 3;
          $scope.terr = terr;
          callback();
        });
    }
  },
]);

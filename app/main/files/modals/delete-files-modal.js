angular.module('web').controller('deleteFilesModalCtrl', [
  '$scope',
  '$q',
  '$uibModalInstance',
  '$timeout',
  'items',
  'currentInfo',
  'callback',
  'ossSvs2',
  'safeApply',
  function(
      $scope,
      $q,
      $modalInstance,
      $timeout,
      items,
      currentInfo,
      callback,
      ossSvs2,
      safeApply
  ) {
    angular.extend($scope, {
      items: items,

      currentInfo: currentInfo,
      step: 1,
      start: start,
      stop: stop,
      close: close
    });

    function stop() {
      // $modalInstance.dismiss('cancel');
      $scope.isStop = true;
      ossSvs2.stopDeleteFiles();
    }
    function close() {
      $modalInstance.dismiss('cancel');
    }

    function start() {
      $scope.isStop = false;
      $scope.step = 2;
      ossSvs2
          .deleteFiles(
              currentInfo.region,
              currentInfo.bucket,
              items,
              function(prog) {
                // 进度
                $scope.progress = angular.copy(prog);
                safeApply($scope);
              }
          )
          .then(function() {
          // 结果
            $scope.step = 3;
            callback();
          })
          ['catch']((e) => {
            $scope.step = 3;
            // item: {isFolder,  path }
            // error message
            $scope.terr = e;
            callback();
          });
    }
  }
]);

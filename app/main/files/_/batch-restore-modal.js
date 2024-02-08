angular.module('web').controller('batchRestoreModalCtrl', [
  '$scope',
  '$uibModalInstance',
  '$translate',
  'ossSvs2',
  'item',
  'currentInfo',
  'callback',
  'Toast',
  'safeApply',
  function (
    $scope,
    $modalInstance,
    $translate,
    ossSvs2,
    items,
    currentInfo,
    callback,
    Toast,
    safeApply,
  ) {
    /* 多文件解冻 */
    var T = $translate.instant;

    angular.extend($scope, {
      currentInfo: currentInfo,
      items: items,
      classList: items.map(item => item.storageClass),
      info: {
        days: 1,
        msg: null,
        coldDays: 1,
        coldMode: 'Expedited',
        deepColdDays: 1,
        deepColdMode: 'Expedited',
      },
      cancel: cancel,
      onSubmit: onSubmit,
    });

    // init();
    function init() {
      $scope.isLoading = true;

      const pros = [];
      for (let i in items) {
        const p = ossSvs2.getFileInfo(currentInfo.region, currentInfo.bucket, items[i].path);
        pros.push(p);
      }

      Promise.all(pros).then(function (datas) {
        const data = datas.find(item => !!item.Restore);
        if (data.Restore) {
          var info = parseRestoreInfo(data.Restore);

          if (info['ongoing-request'] == 'true') {
            $scope.info.type = 2;
          } else {
            $scope.info.type = 3;
            $scope.info.expiry_date = info['expiry-date'];
          }
        } else {
          $scope.info.type = 1;
        }

        $scope.isLoading = false;
        safeApply($scope);
      });
    }

    function parseRestoreInfo(s) {
      var arr = s.match(/([\w-]+)="([^"]+)"/g);
      var m = {};

      angular.forEach(arr, function (n) {
        var kv = n.match(/([\w-]+)="([^"]+)"/);

        m[kv[1]] = kv[2];
      });

      return m;
    }

    function cancel() {
      $modalInstance.dismiss('close');
    }

    function onSubmit(form1) {
      if (!form1.$valid) {
        return;
      }

      var days = $scope.info.days;
      var coldDays = $scope.info.coldDays;
      var coldMode = $scope.info.coldMode;
      var deepColdDays = $scope.info.deepColdDays;
      var deepColdMode = $scope.info.deepColdMode;

      Toast.info(T('restore.on')); // '提交中...'

      const ps = [];
      for (let item of items) {
        const { storageClass, path } = item;

        if (storageClass === 'Archive')
          ps.push(ossSvs2.restoreFile(currentInfo.region, currentInfo.bucket, path, days));
        if (storageClass === 'ColdArchive') {
          ps.push(
            ossSvs2.restoreFile(currentInfo.region, currentInfo.bucket, path, coldDays, coldMode),
          );
        }
        if (storageClass === 'DeepColdArchive') {
          ps.push(
            ossSvs2.restoreFile(
              currentInfo.region,
              currentInfo.bucket,
              path,
              deepColdDays,
              deepColdMode,
            ),
          );
        }
      }
      Promise.all(ps).then(function () {
        callback();
        cancel();
      });

      Toast.success(T('restore.success'), 4000); // '恢复请求已经提交'
    }
  },
]);

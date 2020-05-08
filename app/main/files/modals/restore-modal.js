angular.module("web").controller("restoreModalCtrl", [
  "$scope",
  "$uibModalInstance",
  "$translate",
  "ossSvs2",
  "item",
  "currentInfo",
  "callback",
  "Toast",
  "safeApply",
  function (
    $scope,
    $modalInstance,
    $translate,
    ossSvs2,
    item,
    currentInfo,
    callback,
    Toast,
    safeApply
  ) {
    var T = $translate.instant;
    angular.extend($scope, {
      currentInfo: currentInfo,
      item: item,
      info: {
        days: 1,
        msg: null,
      },
      cancel: cancel,
      onSubmit: onSubmit,
    });

    init();
    function init() {
      $scope.isLoading = true;
      ossSvs2
        .getFileInfo(currentInfo.region, currentInfo.bucket, item.path)
        .then(function (data) {
          if (data.Restore) {
            var info = parseRestoreInfo(data.Restore);
            if (info["ongoing-request"] == "true") {
              $scope.info.type = 2;
              //$scope.info.msg = '正在恢复中，请耐心等待！';
            } else {
              $scope.info.type = 3;
              $scope.info.expiry_date = info["expiry-date"];
              //$scope.info.msg = '可读截止时间：'+ info['expiry-date']
            }
          } else {
            $scope.info.type = 1;
            // $scope.info.msg = null;
          }

          $scope.isLoading = false;
          safeApply($scope);
        });
    }

    function parseRestoreInfo(s) {
      //"ongoing-request="true"
      var arr = s.match(/([\w\-]+)=\"([^\"]+)\"/g);
      var m = {};
      angular.forEach(arr, function (n) {
        var kv = n.match(/([\w\-]+)=\"([^\"]+)\"/);
        m[kv[1]] = kv[2];
      });
      return m;
    }

    function cancel() {
      $modalInstance.dismiss("close");
    }

    function onSubmit(form1) {
      if (!form1.$valid) return;

      var days = $scope.info.days;

      Toast.info(T("restore.on")); //'提交中...'
      ossSvs2
        .restoreFile(currentInfo.region, currentInfo.bucket, item.path, days)
        .then(function () {
          Toast.success(T("restore.success")); //'恢复请求已经提交'
          callback();
          cancel();
        });
    }
  },
]);

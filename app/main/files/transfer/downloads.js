"use strict";

angular.module("web").controller("transferDownloadsCtrl", [
  "$scope",
  "$timeout",
  "$translate",
  "$interval",
  "jobUtil",
  "ossDownloadManager",
  "DelayDone",
  "Toast",
  "Dialog",
  "safeApply",
  function (
    $scope,
    $timeout,
    $translate,
    $interval,
    jobUtil,
    ossDownloadManager,
    DelayDone,
    Toast,
    Dialog,
    safeApply
  ) {
    var T = $translate.instant;
    angular.extend($scope, {
      showRemoveItem: showRemoveItem,
      clearAllCompleted: clearAllCompleted,
      clearAll: clearAll,
      stopAll: stopAll,
      startAll: startAll,
      checkStartJob: checkStartJob,
      openLocaleFolder: function (item) {
        var suffix = item.status == "finished" ? "" : ".download";
        openLocaleFolder(item.to.path + suffix);
      },

      sch: {
        downname: null,
      },
      schKeyFn: function (item) {
        return (
          item.to.name +
          " " +
          item.status +
          " " +
          jobUtil.getStatusLabel(item.status)
        );
      },
      limitToNum: 100,
      loadMoreDownloadItems: loadMoreItems,
    });

    function loadMoreItems() {
      var len = $scope.lists.downloadJobList.length;
      if ($scope.limitToNum < len) {
        $scope.limitToNum += Math.min(100, len - $scope.limitToNum);
      }
    }

    function checkStartJob(item) {
      item.wait();
      ossDownloadManager.checkStart();
    }

    function showRemoveItem(item) {
      if (item.status == "finished") {
        doRemove(item);
      } else {
        var title = T("remove.from.list.title"); //'从列表中移除'
        var message = T("remove.from.list.message"); //'确定移除该下载任务?'
        Dialog.confirm(
          title,
          message,
          function (btn) {
            if (btn) {
              doRemove(item);
            }
          },
          1
        );
      }
    }

    function doRemove(item) {
      var arr = $scope.lists.downloadJobList;
      for (var i = 0; i < arr.length; i++) {
        if (item === arr[i]) {
          arr.splice(i, 1);
          break;
        }
      }
      ossDownloadManager.saveProg();
      $scope.calcTotalProg();
      safeApply($scope);
    }

    function clearAllCompleted() {
      var arr = $scope.lists.downloadJobList;
      for (var i = 0; i < arr.length; i++) {
        if ("finished" == arr[i].status) {
          arr.splice(i, 1);
          i--;
        }
      }

      $scope.calcTotalProg();
    }

    function clearAll() {
      if (
        !$scope.lists.downloadJobList ||
        $scope.lists.downloadJobList.length == 0
      ) {
        return;
      }
      var title = T("clear.all.title"); //清空所有
      var message = T("clear.all.download.message"); //确定清空所有下载任务?
      Dialog.confirm(
        title,
        message,
        function (btn) {
          if (btn) {
            var arr = $scope.lists.downloadJobList;
            for (var i = 0; i < arr.length; i++) {
              var n = arr[i];
              if (
                n.status == "running" ||
                n.status == "waiting" ||
                n.status == "verifying" ||
                n.status == "retrying"
              )
                n.stop();
              arr.splice(i, 1);
              i--;
            }
            $scope.calcTotalProg();
            ossDownloadManager.saveProg();
          }
        },
        1
      );
    }

    var stopFlag = false;

    function stopAll() {
      var arr = $scope.lists.downloadJobList;
      if (arr && arr.length > 0) {
        stopFlag = true;

        ossDownloadManager.stopCreatingJobs();

        Toast.info(T("pause.on")); //'正在暂停...'
        $scope.allActionBtnDisabled = true;

        angular.forEach(arr, function (n) {
          if (
            n.status == "running" ||
            n.status == "waiting" ||
            n.status == "verifying" ||
            n.status == "retrying"
          )
            n.stop();
        });
        Toast.success(T("pause.success")); //'暂停成功'

        $timeout(function () {
          ossDownloadManager.saveProg();
          $scope.allActionBtnDisabled = false;
        }, 100);
      }
    }

    function startAll() {
      var arr = $scope.lists.downloadJobList;
      stopFlag = false;

      //串行
      if (arr && arr.length > 0) {
        $scope.allActionBtnDisabled = true;
        DelayDone.seriesRun(
          arr,
          function eachItemFn(n, fn) {
            if (stopFlag) return;

            if (n && (n.status == "stopped" || n.status == "failed")) {
              n.wait();
            }
            ossDownloadManager.checkStart();
            fn();
          },
          function doneFy() {
            $scope.allActionBtnDisabled = false;
          }
        );
      }
    }
  },
]);

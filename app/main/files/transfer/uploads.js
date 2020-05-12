"use strict";

angular.module("web").controller("transferUploadsCtrl", [
  "$scope",
  "$timeout",
  "$translate",
  "$interval",
  "jobUtil",
  "DelayDone",
  "ossUploadManager",
  "Toast",
  "Dialog",
  function (
    $scope,
    $timeout,
    $translate,
    $interval,
    jobUtil,
    DelayDone,
    ossUploadManager,
    Toast,
    Dialog
  ) {
    var T = $translate.instant;
    angular.extend($scope, {
      showRemoveItem: showRemoveItem,
      clearAllCompleted: clearAllCompleted,
      clearAll: clearAll,
      stopAll: stopAll,
      startAll: startAll,
      checkStartJob: checkStartJob,

      sch: {
        upname: null,
      },
      schKeyFn: function (item) {
        return (
          item.from.name +
          " " +
          item.status +
          " " +
          jobUtil.getStatusLabel(item.status)
        );
      },
      limitToNum: 100,
      loadMoreUploadItems: loadMoreItems,
    });

    function loadMoreItems() {
      var len = $scope.lists.uploadJobList.length;
      if ($scope.limitToNum < len) {
        $scope.limitToNum += Math.min(100, len - $scope.limitToNum);
      }
    }

    function checkStartJob(item) {
      item.wait();
      ossUploadManager.checkStart();
    }

    function showRemoveItem(item) {
      if (item.status == "finished") {
        doRemove(item);
      } else {
        var title = T("remove.from.list.title"); //'从列表中移除'
        var message = T("remove.from.list.message"); //'确定移除该上传任务?'
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
      var arr = $scope.lists.uploadJobList;
      for (var i = 0; i < arr.length; i++) {
        if (item === arr[i]) {
          arr.splice(i, 1);
          break;
        }
      }
      ossUploadManager.saveProg();
      $scope.calcTotalProg();
    }

    function clearAllCompleted() {
      var arr = $scope.lists.uploadJobList;
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
        !$scope.lists.uploadJobList ||
        $scope.lists.uploadJobList.length == 0
      ) {
        return;
      }
      var title = T("clear.all.title"); //清空所有
      var message = T("clear.all.upload.message"); //确定清空所有上传任务?
      Dialog.confirm(
        title,
        message,
        function (btn) {
          if (btn) {
            var arr = $scope.lists.uploadJobList;
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
            ossUploadManager.saveProg();
          }
        },
        1
      );
    }

    var stopFlag = false;
    function stopAll() {
      var arr = $scope.lists.uploadJobList;
      if (arr && arr.length > 0) {
        stopFlag = true;

        ossUploadManager.stopCreatingJobs();

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
        Toast.info(T("pause.success"));

        $timeout(function () {
          ossUploadManager.saveProg();
          $scope.allActionBtnDisabled = false;
        }, 100);
      }
    }

    function startAll() {
      var arr = $scope.lists.uploadJobList;
      stopFlag = false;
      //串行
      if (arr && arr.length > 0) {
        $scope.allActionBtnDisabled = true;
        DelayDone.seriesRun(
          arr,
          function (n, fn) {
            if (stopFlag) {
              return;
            }

            if (n && (n.status == "stopped" || n.status == "failed")) {
              n.wait();
            }

            ossUploadManager.checkStart();

            fn();
          },
          function doneFn() {
            $scope.allActionBtnDisabled = false;
          }
        );
      }
    }
  },
]);

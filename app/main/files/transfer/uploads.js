'use strict';

angular.module('web')
  .controller('transferUploadsCtrl', ['$scope', '$timeout', '$interval', 'ossUploadManager', 'Toast','Dialog',
    function ($scope, $timeout, $interval, ossUploadManager, Toast, Dialog) {

      angular.extend($scope, {
        showRemoveItem: showRemoveItem,
        clearAllCompleted: clearAllCompleted,
        clearAll: clearAll,
        stopAll: stopAll,
        startAll: startAll,
        checkStartJob: checkStartJob
      });

      function checkStartJob(item) {
        item.wait();
        ossUploadManager.checkStart();
      }

      function showRemoveItem(item) {
        if (item.status == 'finished') {
          doRemove(item);
        } else {
          Dialog.confirm('从列表中移除', '确定移除该上传任务?', function (btn) {
            if (btn) {
              doRemove(item);
            }
          }, 1);
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
      }

      function clearAllCompleted() {
        var arr = $scope.lists.uploadJobList;
        for (var i = 0; i < arr.length; i++) {
          if ('finished' == arr[i].status) {
            arr.splice(i, 1);
            i--;
          }
        }
      }

      function clearAll() {
        Dialog.confirm('清空所有', '确定清空所有上传任务?', function (btn) {
          if (btn) {

            var arr = $scope.lists.uploadJobList;
            for (var i = 0; i < arr.length; i++) {
              var n = arr[i];
              if (n.status == 'running' || n.status == 'waiting') n.stop();
              arr.splice(i, 1);
              i--;
            }

            ossUploadManager.saveProg();
          }
        }, 1);
      }

      function stopAll() {
        var arr = $scope.lists.uploadJobList;
        angular.forEach(arr, function (n) {
          if (n.status == 'running' || n.status == 'waiting') n.stop();
        });

        $timeout(function () {
          ossUploadManager.saveProg();
        }, 100);
      }

      function startAll() {
        var arr = $scope.lists.uploadJobList;

        angular.forEach(arr, function (n) {
          if (n.status == 'stopped' || n.status == 'failed') {
            n.wait();
          }
        });

        ossUploadManager.checkStart();
      }

    }
  ]);

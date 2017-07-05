'use strict';

angular.module('web')
  .controller('transferUploadsCtrl', ['$scope', '$timeout', '$interval','jobUtil', 'DelayDone', 'ossUploadManager', 'Toast','Dialog',
    function ($scope, $timeout, $interval, jobUtil, DelayDone, ossUploadManager, Toast, Dialog) {

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
        schKeyFn: function(item){
          return item.from.name +' '+ item.status + ' ' + jobUtil.getStatusLabel(item.status);
        },
        limitToNum: 100,
        loadMoreUploadItems: loadMoreItems
      });

      function loadMoreItems(){
        var len = $scope.lists.uploadJobList.length;
        if($scope.limitToNum < len){
          $scope.limitToNum += Math.min(100, len - $scope.limitToNum);
        }
      }

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
        $scope.calcTotalProg();
      }

      function clearAllCompleted() {
        var arr = $scope.lists.uploadJobList;
        for (var i = 0; i < arr.length; i++) {
          if ('finished' == arr[i].status) {
            arr.splice(i, 1);
            i--;
          }
        }
        $scope.calcTotalProg();
      }

      function clearAll() {
        if(!$scope.lists.uploadJobList || $scope.lists.uploadJobList.length==0){
          return;
        }
        Dialog.confirm('清空所有', '确定清空所有上传任务?', function (btn) {
          if (btn) {

            var arr = $scope.lists.uploadJobList;
            for (var i = 0; i < arr.length; i++) {
              var n = arr[i];
              if (n.status == 'running' || n.status == 'waiting') n.stop();
              arr.splice(i, 1);
              i--;
            }
            $scope.calcTotalProg();
            ossUploadManager.saveProg();
          }
        }, 1);
      }


      var stopFlag = false;
      function stopAll() {
        $scope.stopAllBtnClicked=true;

        var arr = $scope.lists.uploadJobList;
        stopFlag = true;

        Toast.info('正在停止...');

        angular.forEach(arr, function (n) {
          if (n.status == 'running' || n.status == 'waiting') n.stop();
        });
        Toast.success('停止成功');

        $timeout(function () {
          ossUploadManager.saveProg();
          $scope.stopAllBtnClicked=false;
        }, 100);


      }

      function startAll() {
        $scope.startAllBtnClicked=true;

        var arr = $scope.lists.uploadJobList;
        stopFlag = false;
        //串行
        if(arr && arr.length>0){
          DelayDone.seriesRun(arr, function(n, fn){
            if(stopFlag)return;

            if (n.status == 'stopped' || n.status == 'failed'){
              n.wait();
            }

            ossUploadManager.checkStart();

            fn();
          }, function(){
            $scope.startAllBtnClicked=false;
          });
        }
      }
    }
  ]);

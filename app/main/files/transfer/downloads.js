'use strict';

angular.module('web')
  .controller('transferDownloadsCtrl', ['$scope','$timeout','$interval', 'jobUtil','ossDownloadManager','DelayDone','Toast','Dialog','safeApply',
    function($scope,$timeout,$interval,jobUtil, ossDownloadManager,DelayDone,Toast, Dialog,safeApply){

    angular.extend($scope, {
      showRemoveItem: showRemoveItem,
      clearAllCompleted: clearAllCompleted,
      clearAll: clearAll,
      stopAll: stopAll,
      startAll: startAll,
      checkStartJob: checkStartJob,

      sch: {
        downname: null,
      },
      schKeyFn: function(item){
        return item.to.name +' '+ item.status + ' ' + jobUtil.getStatusLabel(item.status);
      },
      limitToNum: 100,
      loadMoreDownloadItems: loadMoreItems
    });

    function loadMoreItems(){
      var len = $scope.lists.downloadJobList.length;
      if($scope.limitToNum < len){
        $scope.limitToNum += Math.min(100, len - $scope.limitToNum);
      }
    }



    function checkStartJob(item){
      item.wait();
      ossDownloadManager.checkStart();
    }


    function showRemoveItem(item){

      if(item.status=='finished'){
        doRemove(item);
      }
      else {
        Dialog.confirm('从列表中移除', '确定移除该下载任务?', function (btn) {
          if (btn) {
            doRemove(item);
          }
        }, 1);
      }
    }

    function doRemove(item){
      var arr = $scope.lists.downloadJobList;
      for(var i=0;i<arr.length;i++) {
        if (item === arr[i]) {
          arr.splice(i, 1);
          break;
        }
      }
      ossDownloadManager.saveProg();
      $scope.calcTotalProg();
      safeApply($scope);
    }

    function clearAllCompleted(){
      var arr = $scope.lists.downloadJobList;
      for (var i = 0; i < arr.length; i++) {
        if ('finished' == arr[i].status) {
          arr.splice(i, 1);
          i--;
        }
      }

      $scope.calcTotalProg();
    }


    function clearAll() {
      if(!$scope.lists.downloadJobList || $scope.lists.downloadJobList.length==0){
        return;
      }
      Dialog.confirm('清空所有', '确定清空所有下载任务?', function (btn) {
        if (btn) {
          var arr = $scope.lists.downloadJobList;
          for (var i = 0; i < arr.length; i++) {
            var n = arr[i];
            if (n.status == 'running' || n.status == 'waiting') n.stop();
            arr.splice(i, 1);
            i--;
          }
          $scope.calcTotalProg();
          ossDownloadManager.saveProg();
        }
      }, 1);
    }

    var  stopFlag = false;
    function stopAll() {

      $scope.stopAllBtnClicked=true;
      $timeout(function(){
        $scope.stopAllBtnClicked=false;
      },1000);

      var arr = $scope.lists.downloadJobList;
      stopFlag = true;

      Toast.info('正在暂停...');

      angular.forEach(arr, function(n){
        if (n.status == 'running' || n.status == 'waiting') n.stop();
      });
      Toast.success('暂停成功');

      $timeout(function(){
        ossDownloadManager.saveProg();
      },100);

    }


    function startAll(){

      $scope.startAllBtnClicked=true;
      $timeout(function(){
        $scope.startAllBtnClicked=false;
      },1000);

      var arr = $scope.lists.downloadJobList;
       stopFlag = false;

      //串行
      if(arr && arr.length>0){
        DelayDone.seriesRun(arr, function eachItemFn(n, fn){
          if( stopFlag) return;

          if (n.status == 'stopped' || n.status == 'failed'){
            n.wait();
          }
          ossDownloadManager.checkStart();
          fn();
        }, function doneFy(){

        });
      }


    }

  }])
;

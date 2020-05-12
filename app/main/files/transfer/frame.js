angular.module("web").controller("transferFrameCtrl", [
  "$scope",
  "$translate",
  "ossUploadManager",
  "ossDownloadManager",
  "Toast",
  "safeApply",
  function (
    $scope,
    $translate,
    ossUploadManager,
    ossDownloadManager,
    Toast,
    safeApply
  ) {
    var T = $translate.instant;
    angular.extend($scope, {
      lists: {
        uploadJobList: [],
        downloadJobList: [],
      },

      totalProg: { loaded: 0, total: 0 },
      totalNum: {
        running: 0,
        total: 0,
        upDone: 0,
        downDone: 0,
        upFailed: 0,
        upStopped: 0,
        downFailed: 0,
        downStopped: 0,
      },
      calcTotalProg: calcTotalProg,

      transTab: 1,
    });

    //functions in parent scope
    $scope.handlers.uploadFilesHandler = uploadFilesHandler;

    $scope.handlers.downloadFilesHandler = downloadFilesHandler;

    ossUploadManager.init($scope);
    ossDownloadManager.init($scope);

    //  $scope.netInit().then(function(){
    //    //确认是否可以使用内部网络，再初始化
    //    ossUploadManager.init($scope);
    //    ossDownloadManager.init($scope);
    //  });

    /**
     * 下载
     * @param fromOssPath {array}  item={region, bucket, path, name, size=0, isFolder=false}  有可能是目录，需要遍历
     * @param toLocalPath {string}
     */
    function downloadFilesHandler(fromOssPath, toLocalPath) {
      Toast.info(T("download.addtolist.on")); //'正在添加到下载队列'
      ossDownloadManager.createDownloadJobs(fromOssPath, toLocalPath, function (
        isCancelled
      ) {
        Toast.info(T("download.addtolist.success")); //'已全部添加到下载队列'
        $scope.toggleTransVisible(true);
        $scope.transTab = 2;
      });
    }
    /**
     * 上传
     * @param filePaths []  {array<string>}  有可能是目录，需要遍历
     * @param bucketInfo {object} {bucket, region, key}
     */
    function uploadFilesHandler(filePaths, bucketInfo) {
      Toast.info(T("upload.addtolist.on")); //'正在添加到上传队列'
      ossUploadManager.createUploadJobs(filePaths, bucketInfo, function (
        isCancelled
      ) {
        Toast.info(T("upload.addtolist.success")); //'已全部添加到上传队列'
        $scope.toggleTransVisible(true);
        $scope.transTab = 1;
      });
    }

    function calcTotalProg() {
      var c = 0,
        c2 = 0;
      var cf = 0,
        cs = 0;
      var cf2 = 0,
        cs2 = 0;
      angular.forEach($scope.lists.uploadJobList, function (n) {
        if (n.status == "running") {
          c++;
        }
        if (n.status == "waiting") {
          c++;
        }
        if (n.status == "verifying") {
          c++;
        }
        if (n.status == "failed") {
          cf++;
        }
        if (n.status == "stopped") {
          c++;
          cs++;
        }
      });
      angular.forEach($scope.lists.downloadJobList, function (n) {
        if (n.status == "running") {
          c2++;
        }
        if (n.status == "waiting") {
          c2++;
        }
        if (n.status == "failed") {
          cf2++;
        }
        if (n.status == "stopped") {
          c2++;
          cs2++;
        }
      });
      //  $scope.totalNum.upRunning = c;
      //  $scope.totalNum.downRunning = c;
      $scope.totalNum.running = c + c2;

      $scope.totalNum.upDone = $scope.lists.uploadJobList.length - c;
      $scope.totalNum.downDone = $scope.lists.downloadJobList.length - c2;

      $scope.totalNum.upFailed = cf;
      $scope.totalNum.downFailed = cf2;
      $scope.totalNum.upStopped = cs;
      $scope.totalNum.downStopped = cs2;

      $scope.totalNum.total =
        $scope.lists.uploadJobList.length + $scope.lists.downloadJobList.length;

      //safeApply($scope);
    }
  },
]);

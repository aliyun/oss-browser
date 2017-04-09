
angular.module('web')
.controller('transferFrameCtrl', ['$scope' ,'ossUploadManager','ossDownloadManager','Toast',
function($scope ,ossUploadManager,ossDownloadManager, Toast){

   angular.extend($scope, {
     lists: {
       uploadJobList: [],
       downloadJobList: [],
     },

     totalProg: {loaded:0,total:0},
     totalNum: {running:0,total:0,  upDone: 0, downDone: 0},
     calcTotalProg: calcTotalProg,

     transTab: 1,
     transVisible: localStorage.getItem('transVisible')=='true',
     toggleTransVisible: function (f){
       $scope.transVisible = f;
       localStorage.setItem('transVisible', f);
     }

   });



   //functions in parent scope
   $scope.handlers.uploadFilesHandler = uploadFilesHandler;
   ossUploadManager.init($scope);
   $scope.handlers.downloadFilesHandler = downloadFilesHandler;
   ossDownloadManager.init($scope);


   /**
    * 下载
    * @param fromOssPath {array}  item={region, bucket, path, name, size=0, isFolder=false}  有可能是目录，需要遍历
    * @param toLocalPath {string}
    */
   function downloadFilesHandler(fromOssPath, toLocalPath) {

     ossDownloadManager.createDownloadJobs(fromOssPath, toLocalPath, function(jobs){
       //console.log(jobs);

       Toast.success('已添加到下载队列');
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
      ossUploadManager.createUploadJobs(filePaths, bucketInfo, function(jobs){
        //console.log(jobs);

        Toast.success('已添加到上传队列');
        $scope.toggleTransVisible(true);
        $scope.transTab = 1;
      });

   }





   function calcTotalProg(){
       var c=0, c2=0;
       angular.forEach($scope.lists.uploadJobList,function(n){
         if(n.status=='running' || n.status=='waiting' || n.status=='stopped'){
           c++;
         }
       });
       angular.forEach($scope.lists.downloadJobList,function(n){
         if(n.status=='running' || n.status=='waiting' || n.status=='stopped'){
           c2++;
         }
       });
      //  $scope.totalNum.upRunning = c;
      //  $scope.totalNum.downRunning = c; 
       $scope.totalNum.running=c + c2;

       $scope.totalNum.upDone = $scope.lists.uploadJobList.length-c;
       $scope.totalNum.downDone = $scope.lists.downloadJobList.length-c2;
       
       $scope.totalNum.total = $scope.lists.uploadJobList.length + $scope.lists.downloadJobList.length;
     }

}]);

angular.module('web')
  .factory('ossUploadManager', ['$q', '$state','$timeout', 'ossSvs2', 'AuthInfo', 'Toast', 'Const', 'DelayDone', 'safeApply', 'settingsSvs',
    function ($q, $state, $timeout, ossSvs2, AuthInfo, Toast, Const, DelayDone, safeApply, settingsSvs) {

      var OssStore = require('./node/ossstore');
      var fs = require('fs');
      var path = require('path');
      var os = require('os');

      var stopCreatingFlag = false;

      var concurrency = 0;

      var $scope;

      return {
        init: init,
        createUploadJobs: createUploadJobs,
        checkStart: checkStart,
        saveProg: saveProg,

        stopCreatingJobs: function(){
          stopCreatingFlag = true;
        }
      };

      function init(scope) {
        $scope = scope;
        concurrency = 0;
        $scope.lists.uploadJobList = [];

        var arr = loadProg();
        var authInfo = AuthInfo.get();

        angular.forEach(arr, function (n) {
          //console.log(n,'<=====');
          var job = createJob(authInfo, n);
          if(job.status=='waiting' || job.status=='running') job.stop();
          addEvents(job);
        });
      }

      function addEvents(job) {
        $scope.lists.uploadJobList.push(job);
        //$scope.calcTotalProg();
        safeApply($scope);
        checkStart();

        //save
        saveProg();

        job.on('partcomplete', function (prog) {
          safeApply($scope);
          //save
          saveProg();
        });

        job.on('statuschange', function (status) {

          if (status == 'stopped') {
            concurrency--;
            $timeout(checkStart,100);
          }

          safeApply($scope);
          //save
          saveProg();
        });

        job.on('complete', function () {
          concurrency--;
          checkStart();
          checkNeedRefreshFileList(job.to.bucket, job.to.key);
          //$scope.$emit('needrefreshfilelists');
        });
        job.on('error', function (err) {
          console.error(err);
          concurrency--;
          checkStart();
        });
      }

      function checkStart() {
        //流控, 同时只能有 n 个上传任务.
        var maxConcurrency = settingsSvs.maxUploadJobCount.get();
        //console.log(concurrency , maxConcurrency);
        concurrency = Math.max(0,concurrency);
        if (concurrency < maxConcurrency) {
          var arr = $scope.lists.uploadJobList;
          for (var i = 0; i < arr.length; i++) {
            if (concurrency >= maxConcurrency) return;

            var n = arr[i];
            if (n.status == 'waiting') {
              n.start();
              concurrency++;
            }

          }
        }
      }

      function checkNeedRefreshFileList(bucket, key){

        if($scope.currentInfo.bucket == bucket){

          var p = path.dirname(key) + '/';
          p = (p == './') ? '' : p;

          if($scope.currentInfo.key == p){
             $scope.$emit('needrefreshfilelists');
          }
        }
      }

      /**
       * 上传
       * @param filePaths []  {array<string>}  有可能是目录，需要遍历
       * @param bucketInfo {object} {bucket, region, key}
       * @param jobsAddingFn {Function} 快速加入列表回调方法， 返回jobs引用，但是该列表长度还在增长。
       * @param jobsAddedFn {Function} 加入列表完成回调方法， jobs列表已经稳定
       */
      function createUploadJobs(filePaths, bucketInfo, jobsAddingFn) {
        stopCreatingFlag = false;
        //console.log('--------uploadFilesHandler:',  filePaths, bucketInfo);

        var authInfo = AuthInfo.get();

        digArr(filePaths, function(){
          if(jobsAddingFn)jobsAddingFn();
        });
        return;

        function digArr(filePaths, fn) {
          var t = [];
          var len = filePaths.length;
          var c = 0;

          function _dig() {
            var n = filePaths[c];
            var dirPath = path.dirname(n);

            if(stopCreatingFlag)return;

            dig(filePaths[c], dirPath, function (jobs) {
              t = t.concat(jobs);
              c++;

              if (c >= len){
                fn(t);
              }
              else{
                _dig();
              }
            });
          }
          _dig();
        }

        function loop(parentPath, dirPath,  arr, callFn) {
          var t = [];
          var len = arr.length;
          var c = 0;
          if(len==0) callFn([]);
          else inDig();

          //串行
          function inDig() {
            dig(path.join(parentPath, arr[c]), dirPath,  function (jobs) {
              t = t.concat(jobs);
              c++;
              //console.log(c,'/',len);
              if (c >= len) callFn(t);
              else{

                if(stopCreatingFlag){
                  return;
                }

                inDig();
              }
            });
          }
        }

        function dig(absPath, dirPath,  callFn) {

          if(stopCreatingFlag){
            return;
          }

          var fileName = path.basename(absPath);

          var filePath = path.relative(dirPath, absPath);

          if(path.sep!='/'){
            //修复window下 \ 问题
            filePath = filePath.replace(/\\/g, '/')
          }

          //修复window下 \ 问题
          filePath = bucketInfo.key ? (bucketInfo.key.replace(/(\/*$)/g, '') +'/'+ filePath ) : filePath;


          if (fs.statSync(absPath).isDirectory()) {
            //创建目录
            ossSvs2.createFolder(bucketInfo.region, bucketInfo.bucket, filePath+ '/').then(function(){
              //判断是否刷新文件列表
              checkNeedRefreshFileList(bucketInfo.bucket, filePath+ '/');
            });

            //递归遍历目录
            // var t = [];
            // var arr = fs.readdirSync(absPath);
            // arr.forEach(function (fname) {
            //   var ret = dig(path.join(absPath, fname), dirPath);
            //   t = t.concat(ret);
            // });

            fs.readdir(absPath, function (err, arr) {

              if (err) {
                console.log(err.stack);
              } else {

                loop(absPath, dirPath,  arr, function (jobs) {

                  $timeout(function(){
                    callFn(jobs);
                  },1);

                });
              }
            });

          } else {
            //文件
            var job = createJob(authInfo, {
              region: bucketInfo.region,
              from: {
                name: fileName,
                path: absPath
              },
              to: {
                bucket: bucketInfo.bucket,
                key: filePath
              }
            });

            addEvents(job);

            $timeout(function(){
              callFn([job]);
            },1);

          }
        }
      }

      /**
      * 创建单个job
      * @param  auth { id, secret}
      * @param  opt   { region, from, to, progress, checkPoints, ...}
      * @param  opt.from {name, path}
      * @param  opt.to   {bucket, key}
      ...
      * @return job  { start(), stop(), status, progress }
              job.events: statuschange, progress
      */
      function createJob(auth, opt) {

        //stsToken
        if(auth.stoken && auth.id.indexOf('STS.')==0){
          var store = new OssStore({
            stsToken: {
              Credentials: {
                AccessKeyId: auth.id,
                AccessKeySecret: auth.secret,
                SecurityToken: auth.stoken
              }
            },
            endpoint: ossSvs2.getOssEndpoint(opt.region, opt.to.bucket, auth.eptpl)
          });
        }
        else{
          var store = new OssStore({
            aliyunCredential: {
              accessKeyId: auth.id,
              secretAccessKey: auth.secret
            },
            endpoint: ossSvs2.getOssEndpoint(opt.region, opt.to.bucket, auth.eptpl)
          });
        }
        return store.createUploadJob(opt);
        // {
        //   region: opt.region,
        //   from: opt.from,
        //   to: opt.to
        // });
      }

      /**
       * 保存进度
       */
      function saveProg() {
        DelayDone.delayRun('save_upload_prog', 1000, function () {
          var t = [];
          angular.forEach($scope.lists.uploadJobList, function (n) {

            if (n.status == 'finished') return;

            if (n.checkPoints && n.checkPoints.chunks) {
              var checkPoints = angular.copy(n.checkPoints);
              delete checkPoints.chunks;
            }

            t.push({
              crc64Str: n.crc64Str,
              checkPoints: checkPoints,
              region: n.region,
              to: n.to,
              from: n.from,
              status: n.status,
              message: n.message,
              prog: n.prog
            });
          });

          //console.log('request save upload:', t);

          //console.log('-save')
          fs.writeFileSync(getUpProgFilePath(), JSON.stringify(t));
          $scope.calcTotalProg();
        }, 20);
      }

      /**
       * 获取保存的进度
       */
      function loadProg() {
        try {
          var data = fs.readFileSync(getUpProgFilePath());
          return JSON.parse(data ? data.toString() : '[]');
        } catch (e) {

        }
        return [];
      }

      //上传进度保存路径
      function getUpProgFilePath() {
        var folder = path.join(os.homedir(), '.oss-browser');
        if(!fs.existsSync(folder)){
           fs.mkdirSync(folder);
        }

        var username = AuthInfo.get().id || '';
        return path.join(folder, 'upprog_' + username + '.json');
      }

    }
  ]);

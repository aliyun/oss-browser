angular.module('web')
  .factory('ossUploadManager', ['$q', '$state', 'ossSvs', 'AuthInfo', 'Toast', 'Const', 'DelayDone', 'safeApply', 'settingsSvs',
    function ($q, $state, ossSvs,  AuthInfo, Toast, Const, DelayDone, safeApply, settingsSvs) {

      var OssStore = require('./node/ossstore');
      var fs = require('fs');
      var path = require('path');
      var os = require('os');

      return {
        init: init,
        createUploadJobs: createUploadJobs,
        checkStart: checkStart,
        saveProg: saveProg,
      };

      var concurrency = 0;

      var $scope;

      function init(scope) {
        $scope = scope;
        concurrency = 0;
        $scope.lists.uploadJobList = [];

        var arr = loadProg();
        var authInfo = AuthInfo.get();

        angular.forEach(arr, function (n) {
          //console.log(n,'<=====');
          var job = createJob(authInfo, n);
          addEvents(job);
        });
      }

      function addEvents(job) {
        $scope.lists.uploadJobList.push(job);
        $scope.calcTotalProg();
        safeApply($scope);
        checkStart();


        job.on('partcomplete', function (prog) {
          safeApply($scope);
          //save
          saveProg();
        });

        job.on('statuschange', function (status) {

          if (status == 'stopped') {
            concurrency--;
            checkStart();
          }

          safeApply($scope);
          //save
          saveProg();
        });

        job.on('complete', function () {
          concurrency--;
          checkStart();
          $scope.$emit('needrefreshfilelists');
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

      /**
       * 上传
       * @param filePaths []  {array<string>}  有可能是目录，需要遍历
       * @param bucketInfo {object} {bucket, region, key}
       */
      function createUploadJobs(filePaths, bucketInfo, fn) {
        //console.log('--------uploadFilesHandler:',  filePaths, bucketInfo);

        var authInfo = AuthInfo.get();

        var t = [];
        angular.forEach(filePaths, function (n) {
          t = t.concat(dig(n, path.dirname(n)));
        });
        //console.log(t);

        angular.forEach(t,function(n){
          addEvents(n);
        });
        return fn(t);


        function dig(absPath, dirPath) {
          var fileName = path.basename(absPath);

          if (fs.statSync(absPath).isDirectory()) {
            //创建目录
            ossSvs.createFolder(bucketInfo.region, bucketInfo.bucket, path.join(bucketInfo.key, fileName) + '/');

            //递归遍历目录
            var t = [];
            var arr = fs.readdirSync(absPath);
            arr.forEach(function (fname) {
              var ret = dig(path.join(absPath, fname), dirPath);
              t = t.concat(ret);
            });
            return t;
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
                key: path.join(bucketInfo.key, path.relative(dirPath, absPath))
              }
            });
            return [job];
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

        var store = new OssStore({
          aliyunCredential: {
            accessKeyId: auth.id,
            secretAccessKey: auth.secret
          },
          endpoint: ossSvs.getOssEndpoint(opt.region)
        });

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
        var t = [];
        angular.forEach($scope.lists.uploadJobList, function (n) {

          if (n.status == 'finished') return;

          if (n.checkPoints && n.checkPoints.chunks) {
            var checkPoints = angular.copy(n.checkPoints);
            delete checkPoints.chunks;
          }

          t.push({
            checkPoints: checkPoints,
            region: n.region,
            to: n.to,
            from: n.from,
            status: n.status,
            prog: n.prog
          });
        });

        //console.log('request save upload:', t);
        DelayDone('save_upload_prog', 1000, function () {
          //console.log('save upload:', t);
          fs.writeFileSync(getUpProgFilePath(), JSON.stringify(t, ' ',2));
          $scope.calcTotalProg();
        });
      }

      /**
       * 获取保存的进度
       */
      function loadProg() {
        try {
          var data = fs.readFileSync(getUpProgFilePath());
        } catch (e) {

        }
        return JSON.parse(data ? data.toString() : '[]');
      }

      //上传进度保存路径
      function getUpProgFilePath() {
        var folder = path.join(os.homedir(),'.oss-browser');
        try{
          fs.statSync(folder).isDirectory();
        }catch(e){
          fs.mkdirSync(folder);
        }
        var username = AuthInfo.get().id || '';
        return path.join(folder, 'upprog_' + username + '.json');
      }

    }
  ]);

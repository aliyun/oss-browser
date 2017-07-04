angular.module('web')
  .factory('ossDownloadManager', ['$q', '$state', '$timeout', 'AuthInfo', 'ossSvs2', 'Toast', 'Const', 'DelayDone', 'safeApply', 'settingsSvs',
   function ($q, $state, $timeout, AuthInfo, ossSvs2, Toast, Const, DelayDone, safeApply, settingsSvs) {

    var OssStore = require('./node/ossstore');
    var fs = require('fs');
    var path = require('path');
    var os = require('os');

    return {
      init: init,
      createDownloadJobs: createDownloadJobs,
      checkStart: checkStart,
      saveProg: saveProg,
    };

    var concurrency = 0;
    var $scope;

    function init(scope) {
      $scope = scope;
      concurrency = 0;
      $scope.lists.downloadJobList = [];
      var arr = loadProg();

      //console.log('----load saving download jobs:' + arr.length);

      var authInfo = AuthInfo.get();

      angular.forEach(arr, function (n) {
        var job = createJob(authInfo, n);
        addEvents(job);
      });
    }

    function addEvents(job) {
      $scope.lists.downloadJobList.push(job);
      $scope.calcTotalProg();
      safeApply($scope);
      checkStart();

      //save
      saveProg();

      job.on('partcomplete', function (prog) {
        safeApply($scope);
        //save
        saveProg($scope);
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
        //$scope.$emit('needrefreshfilelists');
      });

      job.on('error', function (err) {
        console.error(err);
        concurrency--;
        checkStart();
      });

    }

    //流控, 同时只能有 n 个上传任务.
    function checkStart() {
      var maxConcurrency = settingsSvs.maxDownloadJobCount.get();
      concurrency = Math.max(0,concurrency);

      if (concurrency < maxConcurrency) {
        var arr = $scope.lists.downloadJobList;
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
     * 下载
     * @param fromOssInfos {array}  item={region, bucket, path, name, size=0, isFolder=false}  有可能是目录，需要遍历
     * @param toLocalPath {string}
     * @param jobsAddedFn {Function} 加入列表完成回调方法， jobs列表已经稳定
     */
    function createDownloadJobs(fromOssInfos, toLocalPath, jobsAddedFn) {
      //console.log('--------downloadFilesHandler', fromOssInfos, toLocalPath);
      var authInfo = AuthInfo.get();
      var dirPath = path.dirname(fromOssInfos[0].path);

      loop(fromOssInfos, function (jobs) {

      }, function(){
        if(jobsAddedFn) jobsAddedFn();
      });

      function loop(arr, callFn, callFn2) {
        var t = [];
        var len = arr.length;
        var c = 0;
        var c2 =0;

        if(len==0){
          callFn(t);
          callFn2(t);
          return;
        }

        _kdig();
        function _kdig(){
          dig(arr[c], t, function(){

          }, function(){
            c2++;
            if(c2>=len){
              callFn2(t);
            }
          });
          c++;
          if(c==len){
            callFn(t);
          }
          else{
            $timeout(_kdig,10);
          }
        }


        // angular.forEach(arr, function (n) {
        //   dig(n, function (jobs) {
        //     t = t.concat(jobs);
        //     c++;
        //     console.log(c,'/',len);
        //     if (c == len) callFn(t);
        //   });
        // });
      }

      function dig(ossInfo, t, callFn, callFn2) {

        var fileName = path.basename(ossInfo.path);
        var filePath = path.join(toLocalPath, path.relative(dirPath, ossInfo.path));

        if (ossInfo.isFolder) {
          //目录
          fs.mkdir(filePath, function (err) {

            if(err && err.code!='EEXIST'){
                Toast.error('创建目录['+filePath+']失败:'+err.message);
                return;
            }
            //遍历 oss 目录
            function progDig(marker){
              ossSvs2.listFiles(ossInfo.region, ossInfo.bucket, ossInfo.path, marker).then(function (result) {

                var arr2 = result.data;
                arr2.forEach(function (n) {
                  n.region = ossInfo.region;
                  n.bucket = ossInfo.bucket;
                });
                loop(arr2, function (jobs) {
                  t=t.concat(jobs);
                  if(result.marker){
                    $timeout(function(){
                       progDig(result.marker);
                     },10);
                  }else{
                    if(callFn)callFn();
                  }
                }, callFn2);
              });
            }
            progDig();
          });

        } else {
          //文件
          var job = createJob(authInfo, {
            region: ossInfo.region,
            from: {
              bucket: ossInfo.bucket,
              key: ossInfo.path
            },
            to: {
              name: fileName,
              path: filePath
            }
          });

          addEvents(job);

          t.push(job);

          if(callFn)callFn();
          if(callFn2)callFn2();
        }
      }
    }
    /**
     * @param  auth {id, secret}
     * @param  opt { region, from, to, ...}
     * @param  opt.from {bucket, key}
     * @param  opt.to   {name, path}
     * @return job  { start(), stop(), status, progress }
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
          endpoint: ossSvs2.getOssEndpoint(opt.region, opt.to.bucket)
        });
      }
      else{
        var store = new OssStore({
          aliyunCredential: {
            accessKeyId: auth.id,
            secretAccessKey: auth.secret
          },
          endpoint: ossSvs2.getOssEndpoint(opt.region, opt.from.bucket)
        });
      }

      return store.createDownloadJob(opt);
    }

    function saveProg() {

      //console.log('request save:', t);
      DelayDone.delayRun('save_download_prog', 1000, function () {

        var t = [];
        angular.forEach($scope.lists.downloadJobList, function (n) {

          if (n.status == 'finished') return;

          t.push({
            checkPoints: n.checkPoints,
            region: n.region,
            to: n.to,
            from: n.from,
            message: n.message,
            status: n.status,
            prog: n.prog
          });
        });
        //console.log('save:', t);

        fs.writeFileSync(getDownProgFilePath(), JSON.stringify(t, ' ', 2));
        $scope.calcTotalProg();
      },20);
    }

    /**
     * 获取保存的进度
     */
    function loadProg() {
      try {
        var data = fs.readFileSync(getDownProgFilePath());
      } catch (e) {

      }
      return JSON.parse(data ? data.toString() : '[]');
    }

    //下载进度保存路径
    function getDownProgFilePath() {
      var folder = path.join(os.homedir(), '.oss-browser');
      if(!fs.existsSync(folder)){
          fs.mkdirSync(folder);
      }
      var username = AuthInfo.get().id || '';
      return path.join(folder, 'downprog_' + username + '.json');
    }

  }]);

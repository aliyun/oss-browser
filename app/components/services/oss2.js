angular.module('web')
  .factory('ossSvs2', ['$q', '$rootScope', '$timeout', '$state', 'Toast', 'Const', 'AuthInfo',
    function ($q, $rootScope, $timeout, $state, Toast, Const, AuthInfo) {

      var DEF_ADDR = 'oss://';
      //var ALY = require('aliyun-sdk');
      var path = require('path');

      return {
        createFolder: createFolder,
        createBucket: createBucket,
        restoreFile: restoreFile,
        loadStorageStatus: loadStorageStatus,

        getMeta: getFileInfo,
        getFileInfo: getFileInfo, //head object
        checkFolderExists: checkFolderExists,

        listAllBuckets: listAllBuckets,

        listAllFiles: listAllFiles,
        listFiles: listFiles,
        getContent: getContent,
        saveContent: saveContent,

        //重命名
        moveFile: moveFile,
        //复制，移动
        copyFiles: copyFiles,
        stopCopyFiles: stopCopyFiles,

        //删除
        deleteFiles: deleteFiles,
        stopDeleteFiles: stopDeleteFiles,

        //碎片
        listAllUploads: listAllUploads,
        abortAllUploads: abortAllUploads,

        deleteBucket: deleteBucket,

        getBucketACL: getBucketACL,
        updateBucketACL: updateBucketACL,
        getACL: getACL,
        updateACL: updateACL,


        getClient: getClient,
        parseOSSPath: parseOSSPath,
        getOssEndpoint: getOssEndpoint,
        parseRestoreInfo: parseRestoreInfo,
        signatureUrl: signatureUrl,
      };

      function checkFolderExists(region, bucket, prefix){
        var df = $q.defer();
        var client = getClient({region:region, bucket:bucket});
        client.listObjects({Bucket:bucket, Prefix:prefix, MaxKeys: 1}, function(err, data){
          if(err){
            handleError(err);
            df.reject(err);
          }
          else{
            if(data.Contents.length>0 && data.Contents[0].Key.indexOf(prefix)==0){
              df.resolve(true);
            }else{
              df.resolve(false);
            }
          }
        });
        return df.promise;
      }


      var stopDeleteFilesFlag=false;
      function stopDeleteFiles(){
        stopDeleteFilesFlag = true;
      }

      /**
      * 批量删除文件或目录
      * @param region {string}
      * @param bucket {string}
      * @param items   {array}  item={path,isFolder}
      * @param progCb  {function} 可选， 进度回调  (current,total)
      */
      function deleteFiles(region, bucket, items, progCb){

        stopDeleteFilesFlag = false;

        var df = $q.defer();

        var client = getClient({region:region, bucket:bucket});
        var progress={current:0,total:0, errorCount:0};

        function delArr(arr, fn){
          var c = 0;
          var len = arr.length;
          var terr = [];

          function dig(){

            if(c>=len){
              if(progCb) progCb(progress);
              fn(terr);
              return;
            }

            if(stopDeleteFilesFlag){
              //停止删除
              for(var i=c;i<arr.length;i++){
                terr.push({item: arr[i], error: new Error('User cancelled')});
              }
              if(progCb) progCb(progress);
              fn(terr);
              return;
            };


            if(progCb) progCb(progress);

            var item = arr[c];

            if(item.isFolder){
              listAllFiles(region, bucket, item.path).then(function(arr2){

                progress.total += arr2.length;
                //删除所有文件
                delArr(arr2, function(terr2){
                  if(terr2) terr = terr.concat(terr2);
                  //删除目录本身
                  delFile(item);
                });
              }, function(err){
                //删除目录本身
                delFile(item);
              });
            }
            else{
              //删除文件
              delFile(item);
            }

            function delFile(item){
              if(stopDeleteFilesFlag){
                dig();
                return;
              }

              // c++;
              // setTimeout(function(){
              //   progress.current++;
              //   dig();
              // },1000)

              client.deleteObject({Bucket:bucket, Key: item.path}, function(err){
                if(err){
                  terr.push({item:item, error:err});
                  progress.errorCount++;
                  c++;
                  dig();
                }
                else{
                  c++;
                  progress.current++;
                  dig();
                }
              });
            }
          }
          dig();
        }

        progress.total += items.length;

        delArr(items, function(terr){
          if(terr && terr.length>0){
            df.resolve(terr);
          }else{
            df.resolve();
          }
        });
        return df.promise;
      }


      var stopCopyFilesFlag=false;
      function stopCopyFiles(){
        stopCopyFilesFlag = true;
      }
      /**
      * 批量复制或移动文件
      * @param retion {string} 要求相同region
      * @param items {array} 需要被复制的文件列表，可能为folder，可能为file
      * @param target {object} {bucket,key} 目标目录路径
      * @param progFn {Function} 进度回调  {current:1, total: 11, errorCount: 0}
      * @param removeAfterCopy {boolean} 移动flag，复制后删除。 默认false
      * @param renameKey {string} 重命名目录的 key。
      */
      function copyFiles(region, items, target, progFn, removeAfterCopy, renameKey){

        var progress = {
          total: 0,
          current: 0,
          errorCount: 0
        };
        stopCopyFilesFlag = false;

        //入口
        var df = $q.defer();
        digArr(items, target, renameKey, function(terr){
          df.resolve(terr);
        });
        return df.promise;

        //copy oss file
        function copyOssFile(client, from, to, fn){
          if(stopCopyFilesFlag) return;

          var toKey = to.key;
          var fromKeyOrigin = '/'+from.bucket+'/'+(from.key);
          var fromKey = '/'+from.bucket+'/'+encodeURIComponent(from.key);
          console.info(removeAfterCopy?'move':'copy', '::',fromKeyOrigin, '==>', toKey);

          client.copyObject({Bucket: to.bucket, Key:toKey, CopySource: fromKey},function(err){
            if(err){
              fn(err);
              return;
            }

            if(removeAfterCopy){
              var client2 = getClient({region: region, bucket: from.bucket});
              client2.deleteObject({Bucket: from.bucket, Key: from.key}, function(err){
                if(err) fn(err);
                else fn();
              });
            }
            else{
              fn();
            }
          });
        }

        //打平，一条一条 copy
        function doCopyOssFiles(bucket, pkey, arr, target, fn){
          var len = arr.length;
          var c= 0;
          var t=[];

          progress.total+=len;

          var client = getClient({region: region, bucket: target.bucket});

          function _dig(){
            if(c>=len){
              fn(t);
              return;
            }


            if(stopCopyFilesFlag){
              //停止
              for(var i=c;i<arr.length;i++){
                t.push({item: arr[i], error: new Error('User cancelled')});
              }
              if(progFn) progFn(progress);
              fn(t);
              return;
            };


            var item = arr[c];
            var toKey = target.key.replace(/\/$/,'');
            toKey = (toKey?toKey+'/': '')+ (item.path.substring(pkey.length));

            copyOssFile(client, {bucket:bucket,key: item.path},{bucket:bucket, key: toKey}, function(err){
              if(err){
                progress.errorCount++;
                if(progFn)progFn(progress);
                t.push({item:item, error:err});
              }
              progress.current++;
              if(progFn)progFn(progress);
              c++;
              _dig();
            });
          }
          _dig();
        }

        function doCopyFolder(source, target, fn){
          var t=[];
          var client = getClient({region: region, bucket: source.bucket});

          nextList();

          function nextList(marker){
            var opt = {Bucket: source.bucket, Prefix: source.path};
            if(marker) opt.Marker=marker;

            client.listObjects(opt, function(err, result){

              if(err){
                t.push({item: source, error:err});
                fn(t);
                return;
              }
              var newTarget = {
                key: target.key,
                bucket: target.bucket
              };


              var prefix = opt.Prefix;
              if (!prefix.endsWith('/')) {
                prefix = prefix.substring(0, prefix.lastIndexOf('/') + 1)
              }

              var objs = [];
              result['Contents'].forEach(function (n) {
                n.Prefix = n.Prefix || '';

                //if (!opt.Prefix.endsWith('/') || n.Key != opt.Prefix) {
                  n.isFile = true;
                  n.itemType = 'file';
                  n.path = n.Key;
                  n.name = n.Key.substring(prefix.length);
                  n.size = n.Size;
                  n.storageClass = n.StorageClass;
                  n.type = n.Type;
                  n.url = getOssUrl(region, opt.Bucket, n.Key);

                  objs.push(n);
                //}
              });

              doCopyOssFiles(source.bucket, source.path, objs, newTarget, function(terr){

                if(terr)t=t.concat(terr);
                if(result.NextMarker){
                  nextList(result.NextMarker);
                }
                else{
                  if(removeAfterCopy && terr.length==0){
                    //移动全部成功， 删除目录
                    client.deleteObject({Bucket: source.bucket, Key: source.path}, function(err){
                      fn(t);
                    });
                  }
                  else fn(t);
                }
              });


            });
          }
        }

        function doCopyFile(source, target, fn){
          var client = getClient({region: region, bucket: target.bucket});
          copyOssFile(client, {bucket: source.bucket, key: source.path}, {bucket: target.bucket, key:target.key}, function(err){
            if(err){
              fn(err);
            }
            else{
              fn();
            }
          });
        }

        function digArr(items, target, renameKey, fn){
          var len = items.length;
          var c=0;
          var terr=[];

          progress.total+=len;
          if(progFn)progFn(progress);

          function _(){

            if(c>=len){
              fn(terr);
              return;
            }

            if(stopCopyFilesFlag){
              //停止
              for(var i=c;i<items.length;i++){
                terr.push({item: items[i], error: new Error('User cancelled')});
              }
              if(progFn) progFn(progress);
              fn(terr);
              return;
            };

            var item = items[c];
            var toKey = renameKey;

            if(!renameKey){
              toKey = target.key.replace(/\/$/,''); 
              toKey = (toKey?toKey+'/': '')+(items[c].name);
            }


            var newTarget = {
              key: toKey, //target.key.replace(/\/$/,'')+'/'+items[c].name,
              bucket: target.bucket
            };
            c++;

            if(item.isFile){
              doCopyFile(item, newTarget, function(err){
                if(err){
                  progress.errorCount++;
                  if(progFn)progFn(progress);
                  terr.push({item: items[c], error:err});
                }
                progress.current++;
                if(progFn)progFn(progress);
                _();
              });
            }
            else{
              doCopyFolder(item, newTarget, function(errs){
                if(errs){
                  terr = terr.concat(errs);
                }
                progress.current++;
                if(progFn)progFn(progress);
                _();
              });
            }
          }
          _();
        }
      }

      //移动文件，重命名文件
      function moveFile(region, bucket, oldKey, newKey){
        var df = $q.defer();
        var client = getClient({region:region, bucket:bucket});
        client.copyObject({
          Bucket: bucket,
          Key: newKey,
          CopySource: '/'+bucket+'/'+encodeURIComponent(oldKey),
          MetadataDirective: 'REPLACE'     // 'REPLACE' 表示覆盖 meta 信息，'COPY' 表示不覆盖，只拷贝
        }, function(err){
          if(err){
            df.reject(err);
            handleError(err);
          }
          else{
            client.deleteObject({Bucket: bucket, Key: oldKey}, function(err){
              if(err){
                df.reject(err);
                handleError(err);
              }else  df.resolve();
            });
          }
        });
        return df.promise;
      }
      /**************************************/


      function listAllUploads(region, bucket){
        var maxUploads = 100;
        var client = getClient({region:region, bucket:bucket});
        var t=[];
        var df = $q.defer();
        function dig(opt){
          opt = angular.extend({Bucket: bucket, Prefix: '', 'MaxUploads':maxUploads}, opt);
          client.listMultipartUploads(opt, function(err, result){
            if(err){
              df.reject(err);
              return;
            }

            angular.forEach(result.Uploads, function(n){
              n.initiated = n.Initiated;
              n.name = n.Key;
              n.storageClass = n.StorageClass;
              n.uploadId = n.UploadId;
            });

            t = t.concat(result.Uploads);

            if(result.Uploads.length==maxUploads){
              dig({'KeyMarker':result.NextKeyMarker, 'UploadIdMarker':result.NextUploadIdMarker});
            }
            else{
              df.resolve(t);
            }
          });
        }
        dig({});
        return df.promise;
      }
      function abortAllUploads(region, bucket, uploads){
        var df=$q.defer();
        var client = getClient({region:region, bucket:bucket});
        var len = uploads.length;
        var c=0;
        function dig(){
          if(c>=len){
            df.resolve();
            return;
          }
          client.abortMultipartUpload({
            Bucket: bucket,
            Key: uploads[c].name,
            UploadId: uploads[c].uploadId
          }, function(err, result){
            if(err) df.reject(err);
            else{
              c++;
              dig();
            }
          });
        }
        dig();
        return df.promise;
      }

      function createFolder(region, bucket, prefix){
        return new Promise(function (a, b) {
          var client = getClient({
            region: region,
            bucket: bucket
          });
          client.putObject({
            Bucket: bucket,
            Key: prefix,
            Body: ''
          }, function (err, data) {
            if (err) {
              handleError(err);
              b(err);
            } else {
              a(data);
            }
          });
        });

      }

      function deleteBucket(region, bucket){
        return new Promise(function (a, b) {
          var client = getClient({
            region: region,
            bucket: bucket
          });
          client.deleteBucket({
            Bucket: bucket
          }, function (err, data) {
            if (err) {
              handleError(err);
              b(err);
            } else {
              a(data);
            }
          });
        });
      }
      function signatureUrl(region, bucket, key, expiresSec){
        var client = getClient({
          region: region,
          bucket: bucket
        });

        var url= client.getSignedUrl('getObject',{
          Bucket: bucket,
          Key: key,
          Expires: expiresSec || 60
        });
        return url;
      }

      function getBucketACL(region, bucket){
        var df = $q.defer();
        var client = getClient({region:region, bucket:bucket});
        client.getBucketAcl({
          Bucket: bucket
        }, function(err, data){
          if(err){
            handleError(err);
            df.reject(err);
          }else{
            if(data.Grants && data.Grants.length==1){
              var t=[];
              for(var k in data.Grants[0]){
                t.push(data.Grants[0][k]);
              }
              data.acl = t.join('');
            }else{
              data.acl = 'default';
            }
            df.resolve(data);
          }
        });
        return df.promise;
      }
      function updateBucketACL(region, bucket, acl){
        var df = $q.defer();
        var client = getClient({region:region, bucket:bucket});
        client.putBucketAcl({
          Bucket: bucket,
          ACL: acl
        }, function(err, data){
          if(err){
            handleError(err);
            df.reject(err);
          }else{
            df.resolve(data);
          }
        });
        return df.promise;
      }
      function getACL(region, bucket, key) {
        return new Promise(function (a, b) {
          var client = getClient({
            region: region,
            bucket: bucket
          });
          client.getObjectAcl({
            Bucket: bucket,
            Key: key
          }, function (err, data) {
            if (err) {
              handleError(err);
              b(err);
            } else {
              if(data.Grants && data.Grants.length==1){
                var t=[];
                for(var k in data.Grants[0]){
                  t.push(data.Grants[0][k]);
                }
                data.acl = t.join('');
              }else{
                data.acl = 'default';
              }
              a(data);
            }
          });
        });
      }
      function updateACL(region, bucket, key, acl) {
        return new Promise(function (a, b) {
          var client = getClient({
            region: region,
            bucket: bucket
          });
          client.putObjectAcl({
            Bucket: bucket,
            Key: key,
            ACL: acl
          }, function (err, data) {
            if (err) {
              handleError(err);
              b(err);
            } else {
              a(data);
            }
          });
        });
      }

      function getContent(region, bucket, key) {
        return new Promise(function (a, b) {
          var client = getClient({
            region: region,
            bucket: bucket
          });
          client.getObject({
            Bucket: bucket,
            Key: key
          }, function (err, data) {
            if (err) {
              handleError(err);
              b(err);
            } else {
              a(data);
            }
          });
        });
      }

      function saveContent(region, bucket, key, content) {
        return new Promise(function (a, b) {
          var client = getClient({
            region: region,
            bucket: bucket
          });
          client.putObject({
            Bucket: bucket,
            Key: key,
            Body: content
          }, function (err) {
            if (err) {
              handleError(err);
              b(err);
            } else {
              a();
            }
          });
        });
      }

      function createBucket(region, bucket, acl, storageClass) {

        return new Promise(function (a, b) {
          var client = getClient({
            region: region,
            bucket: bucket
          });
          client.createBucket({
            Bucket: bucket,
            CreateBucketConfiguration: {
              StorageClass: storageClass
            }
          }, function (err, data) {
            if (err) {
              handleError(err);
              b(err);
            } else {
              client.putBucketAcl({
                Bucket: bucket,
                ACL: acl
              }, function (err, data) {
                if (err) {
                  handleError(err);
                  b(err);
                } else {
                  a(data);
                }
              });
            }
          });
        });
      }

      function getFileInfo(region, bucket, key) {
        return new Promise(function (a, b) {
          var client = getClient({
            region: region,
            bucket: bucket
          });
          var opt = {
            Bucket: bucket,
            Key: key
          };
          client.headObject(opt, function (err, data) {

            if (err) {
              handleError(err);
              b(err);
            } else {
              a(data);
            }
          });
        });
      }

      function restoreFile(region, bucket, key, days) {

        return new Promise(function (a, b) {
          var client = getClient({
            region: region,
            bucket: bucket
          });
          var opt = {
            Bucket: bucket,
            Key: key,
            RestoreRequest: {
              Days: days || 7
            }
          };

          client.restoreObject(opt, function (err, data) {
            if (err) {
              handleError(err);
              b(err);
            } else {
              a(data);
            }
          });
        });
      }

      function listFiles(region, bucket, key, marker) {
        return new Promise(function(a,b){
          _listFilesOrigion(region, bucket, key, marker).then(function(result){
              var arr = result.data;
              if (arr && arr.length) {
                $timeout( ()=> {
                  loadStorageStatus(region, bucket, arr);
                });
              }
              a(result);
          }, function(err){
            b(err);
          });
        });
      }

      function loadStorageStatus(region, bucket, arr){
         return new Promise(function(a,b){
            var len = arr.length;
            var c = 0;
            _dig();

            function _dig(){
               if(c >= len){
                  a();
                  return;
               }
               var item = arr[c];
               c++

               if (!item.isFile || item.storageClass != 'Archive'){
                 _dig();
                 return;
               }

               getFileInfo(region, bucket, item.path).then(function(data){
                  if (data.Restore) {
                    var info = parseRestoreInfo(data.Restore);
                    if (info['ongoing-request'] == 'true') {
                      item.storageStatus = 2; // '归档文件正在恢复中，请耐心等待...';
                    } else {
                      item.expired_time = info['expiry-date'];
                      item.storageStatus = 3; // '归档文件，已恢复，可读截止时间
                    }
                  }else{
                    item.storageStatus = 1;
                  }
                  $timeout(_dig, 10);
               }, function(err){
                 b(err);
                 $timeout(_dig, 100);
               });
            }
         });
      }

      function _listFilesOrigion(region, bucket, key, marker) {

        return new Promise(function (resolve, reject) {
          var client = getClient({
            region: region,
            bucket: bucket
          });


          var t = [];
          var t_pre = [];
          var opt = {
            Bucket: bucket,
            Prefix: key,
            Delimiter: '/',
            Marker: marker || ''
          };

          client.listObjects(opt, function (err, result) {

            if (err) {
              handleError(err);
              reject(err);
              return;
            }

            var prefix = opt.Prefix;
            if (!prefix.endsWith('/')) {
              prefix = prefix.substring(0, prefix.lastIndexOf('/') + 1)
            }

            if (result.CommonPrefixes) {
              //目录
              result.CommonPrefixes.forEach(function (n) {
                n = n.Prefix;
                t_pre.push({
                  name: n.substring(prefix.length).replace(/(\/$)/, ''),
                  path: n,
                  //size: 0,
                  isFolder: true,
                  itemType: 'folder'
                });
              });
            }

            if (result['Contents']) {
              //文件
              result['Contents'].forEach(function (n) {
                n.Prefix = n.Prefix || '';

                if (!opt.Prefix.endsWith('/') || n.Key != opt.Prefix) {
                  n.isFile = true;
                  n.itemType = 'file';
                  n.path = n.Key;
                  n.name = n.Key.substring(prefix.length);
                  n.size = n.Size;
                  n.storageClass = n.StorageClass;
                  n.type = n.Type;
                  n.url =  getOssUrl(region, opt.Bucket, n.Key);

                  t.push(n);
                }
              });
            }


            resolve({
              data: t_pre.concat(t),
              marker: result.NextMarker
            });

          });

        });
      }


      //同一时间只能有一个查询，上一个查询如果没有完成，则会被abort
      var keepListFilesJob;

      function listAllFiles(region, bucket, key, folderOnly) {

        if (keepListFilesJob) {
          keepListFilesJob.abort();
          keepListFilesJob = null;
        }

        return new Promise(function (a, b) {
          keepListFilesJob = new DeepListJob(region, bucket, key, folderOnly, function (data) {
            a(data)
          }, function (err) {
            handleError(err);
            b(err)
          });
        });
      }

      function DeepListJob(region, bucket, key, folderOnly, succFn, errFn) {
        var stopFlag = false;

        var client = getClient({
          region: region,
          bucket: bucket
        });


        var t = [];
        var t_pre = [];
        var opt = {
          Bucket: bucket,
          Prefix: key,
          Delimiter: '/'
        };
        _dig();

        function _dig() {
          if (stopFlag) return;
          client.listObjects(opt, function (err, result) {
            if (stopFlag) return;
            if (err) {
              errFn(err);
              return;
            }

            var prefix = opt.Prefix;
            if (!prefix.endsWith('/')) {
              prefix = prefix.substring(0, prefix.lastIndexOf('/') + 1)
            }

            if (result.CommonPrefixes) {
              //目录
              result.CommonPrefixes.forEach(function (n) {
                n = n.Prefix;
                t_pre.push({
                  name: n.substring(prefix.length).replace(/(\/$)/, ''),
                  path: n,
                  //size: 0,
                  isFolder: true,
                  itemType: 'folder'
                });
              });
            }

            if (!folderOnly && result['Contents']) {
              //文件
              result['Contents'].forEach(function (n) {
                n.Prefix = n.Prefix || '';

                if (!opt.Prefix.endsWith('/') || n.Key != opt.Prefix) {
                  n.isFile = true;
                  n.itemType = 'file';
                  n.path = n.Key;
                  n.name = n.Key.substring(prefix.length);
                  n.size = n.Size;
                  n.storageClass = n.StorageClass;
                  n.type = n.Type;
                  n.url = getOssUrl(region, opt.Bucket, n.Key);

                  t.push(n);
                }
              });
            }

            if (result.NextMarker) {
              opt.Marker = result.NextMarker;
              $timeout(_dig, 10);
            } else {
              if (stopFlag) return;
              succFn(t_pre.concat(t));
            }
          });
        }

        //////////////////////////
        this.abort = function () {
          stopFlag = true;
        }
      }

      function listAllBuckets() {
        return new Promise(function (resolve, reject) {
          var client = getClient();

          var t = [];

          var opt = {};
          _dig();

          function _dig() {

            client.listBuckets(opt, function (err, result) {
              if (err) {
                handleError(err);
                reject(err);
                return;
              }

              //bucket
              if (result['Buckets']) {
                result['Buckets'].forEach(function (n) {
                  n.creationDate = n.CreationDate;
                  n.region = n.Location;
                  n.name = n.Name;
                  n.extranetEndpoint = n.ExtranetEndpoint;
                  n.intranetEndpoint = n.IntranetEndpoint;
                  n.storageClass = n.StorageClass;

                  n.isBucket = true;
                  n.itemType = 'bucket';
                });
                t = t.concat(result['Buckets']);
              }

              if (result.NextMarker) {
                opt.Marker = result.NextMarker;
                _dig();
              } else {
                resolve(t);
              }
            });
          }
        });

      }

      function parseRestoreInfo(s) {
        //"ongoing-request="true"
        var arr = s.match(/([\w\-]+)=\"([^\"]+)\"/g);
        var m = {};
        angular.forEach(arr, function (n) {
          var kv = n.match(/([\w\-]+)=\"([^\"]+)\"/);
          m[kv[1]] = kv[2];
        });
        return m;
      }

      function handleError(err) {
        if (err.code == 'InvalidAccessKeyId') {
          $state.go('login');
        } else {

          if (!err.code) {
            if (err.message.indexOf('Failed to fetch') != -1) {
              err = {
                code: 'Error',
                message: '无法连接'
              };
            } else err = {
              code: 'Error',
              message: err.message
            };
          }
          if(err.code=='NetworkingError' && err.message.indexOf('ENOTFOUND')!=-1){
            console.error(err);
          }
          else Toast.error(err.code + ': ' + err.message);
        }
      }

      /**
       * @param opt   {object|string}
       *    object = {id, secret, region, bucket}
       */
      function getClient(opt) {
        var authInfo = AuthInfo.get();

        var bucket;
        if (opt) {
          if (typeof (opt) == 'object') {
            angular.extend(authInfo, opt);
            bucket = opt.bucket;
          }
        }

        var endpoint = getOssEndpoint(authInfo.region || 'oss-cn-beijing', bucket);
        var options = {
          accessKeyId: authInfo.id || 'a',
          secretAccessKey: authInfo.secret || 'a',
          endpoint: endpoint,
          apiVersion: '2013-10-15'
        };

        if(authInfo.id && authInfo.id.indexOf('STS.')==0){
            options.securityToken= authInfo.stoken || null;
        }
        var client = new ALY.OSS(options);
        return client;
      }

      function parseOSSPath(ossPath) {
         if(!ossPath || ossPath.indexOf(DEF_ADDR)==-1 || ossPath==DEF_ADDR){
           return {};
         }

         var str = ossPath.substring(DEF_ADDR.length);
         var ind = str.indexOf('/');
         if(ind==-1){
           var bucket = str;
           var key = '';
         }else{
           var bucket = str.substring(0, ind);
           var key = str.substring(ind+1);
         }
         return {bucket:bucket, key:key};
      }


      function getOssUrl(region, bucket, key){
        var isHttps = Global.ossEndpointProtocol == 'https:';


        if (bucket && $rootScope.bucketMap && $rootScope.bucketMap[bucket]) {
          var endpoint = $rootScope.bucketMap[bucket].extranetEndpoint;
          if (endpoint){
            return isHttps ? ('https://'+ bucket+'.'+ endpoint + ':443' +'/' + key) : ('http://'+ bucket+'.' + endpoint + '/' + key);
          }
        }

        //region是domain
        if (region.indexOf('.') != -1) {
          if (region.indexOf('http') != 0) {
            region = Global.ossEndpointProtocol == 'https:' ? ('https://'+ bucket+'.' + region + ':443'+'/' + key) : ('http://' + bucket+'.'+ region+'/' + key);
          }
          return region;
        }


        //region
        if (Global.ossEndpointProtocol == 'https:') {
          return 'https://' + bucket+'.'+ region + '.aliyuncs.com:443'+'/' + key;
        }
        return 'http://' + bucket+'.'+ region + '.aliyuncs.com'+'/' + key;

      }

      function getOssEndpoint(region, bucket) {
        var isHttps = Global.ossEndpointProtocol == 'https:';
        //通过bucket获取endpoint
        if (bucket && $rootScope.bucketMap && $rootScope.bucketMap[bucket]) {
          var endpoint = $rootScope.bucketMap[bucket][$rootScope.internalSupported?'intranetEndpoint':'extranetEndpoint'];
          if (endpoint) return isHttps ? ('https://' + endpoint + ':443') : ('http://' + endpoint);
        }

        //region是domain
        if (region.indexOf('.') != -1) {
          if (region.indexOf('http') != 0) {
            region = Global.ossEndpointProtocol == 'https:' ? ('https://' + region + ':443') : ('http://' + region);
          }
          return region;
        }

        //region
        if (Global.ossEndpointProtocol == 'https:') {
          return $rootScope.internalSupported
              ?'https://' + region + '-internal.aliyuncs.com:443'
              :'https://' + region + '.aliyuncs.com:443';
        }
        return $rootScope.internalSupported
              ? 'http://' + region + '-internal.aliyuncs.com'
              : 'http://' + region + '.aliyuncs.com';
      }

    }
  ]);

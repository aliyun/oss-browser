angular.module('web')
  .factory('ossSvs', ['$q','$rootScope','$state','Toast','Const','AuthInfo',
  function ( $q, $rootScope, $state, Toast, Const, AuthInfo) {
    var AUTH_INFO = Const.AUTH_INFO_KEY;
    var DEF_ADDR = 'oss://';
    //var ALY = require('aliyun-sdk');
    var path = require('path');

    return {
      getOssEndpoint: getOssEndpoint,
      parseOSSPath: parseOSSPath,
      getClient: getClient,

      listAllBuckets: listAllBuckets,
      deleteBucket: deleteBucket,
      createBucket: createBucket,
      getBucketACL: getBucketACL,
      updateBucketACL: updateBucketACL,

      listFiles: listFiles,
      deleteFiles: deleteFiles,
      stopDeleteFiles: stopDeleteFiles,
      createFolder: createFolder,

      getContent: getContent,
      saveContent: saveContent,
      getMeta: getMeta,

       //碎片
      listAllUploads: listAllUploads,
      abortAllUploads: abortAllUploads,

      //重命名
      moveFile: moveFile,
      //复制，移动
      copyFiles: copyFiles,

      signatureUrl: signatureUrl,
      getACL: getACL,
      updateACL: updateACL
    };



    /**
    * 签名URL
    * @param region
    * @param bucket
    * @param key
    * @param expiresSec {int} 有效期, default: 3600 单位：秒
    */
    function signatureUrl(region, bucket, key, expiresSec){

      var client = getClient({region:region, bucket:bucket});
      var url = client.signatureUrl(key, {
        expires: expiresSec||3600,
        response: {
          'content-type': 'text/custom',
          'content-disposition': 'attachment'
        }
      });
      return url;
    }

    var stopCopyFilesFlag=false;
    function stopCopyFiles(){
      stopCopyFilesFlag = true;
    }
    /**
    * 批量复制或移动文件
    * @param retion {string} 要求相同region
    * @param items {array} 需要被复制的文件列表，可能为folder，可能为file
    * @param target {object} {bucket,key}
    * @param progFn {Function} 进度回调  {current:1, total: 11, errorCount: 0}
    * @param removeAfterCopy {boolean} 移动flag，复制后删除。 默认false
    */
    function copyFiles(region, items, target, progFn, removeAfterCopy){
      var progress = {
        total: 0,
        current: 0,
        errorCount: 0
      };
      stopCopyFilesFlag = false;

      //入口
      var df = $q.defer();
      digArr(items, target, function(terr){
        df.resolve(terr);
      });
      return df.promise;

      //copy oss file
      function copyOssFile(client, from, to, fn){
        if(stopCopyFilesFlag) return;

        var toKey = to.key;
        var fromKey = '/'+from.bucket+'/'+from.key;
        console.log(removeAfterCopy?'move':'copy', '::',fromKey, '==>', toKey);

        client.copy(toKey, fromKey).then(function(){
          if(removeAfterCopy){
            var client2 = getClient({region: region, bucket: from.bucket});
            client2.delete(from.key).then(function(){
              fn();
            },function(err){
              fn(err);
            });
          }
          else{
            fn();
          }
        }, function(err){
          fn(err);
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
          var toKey = target.key.replace(/\/$/,'')+'/'+ (item.name.substring(pkey.length));
          copyOssFile(client, {bucket:bucket,key: item.name},{bucket:bucket, key: toKey}, function(err){
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
          var opt = {prefix: source.path};
          if(marker)opt.marker=marker;
          client.list(opt).then(function(result){
            var newTarget = {
              key: target.key,
              bucket: target.bucket
            };

            doCopyOssFiles(source.bucket, source.path, result.objects, newTarget, function(terr){
              if(terr)t=t.concat(terr);
              if(result.nextMarker){
                nextList(result.nextMarker);
              }
              else{
                fn(t);
              }
            });
          }, function(err){
            t.push({item: source, error:err});
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

      function digArr(items, target, fn){
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
          var newTarget = {
            key: target.key.replace(/\/$/,'')+'/'+items[c].name,
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
      client.copy(newKey, encodeURI('/'+bucket+'/'+oldKey)).then(function(){
        client.delete(oldKey).then(function(){
          df.resolve();
        }, function(err){
          df.reject(err);
          handleError(err);
        });
      }, function(err){
        df.reject(err);
        handleError(err);
      });
      return df.promise;
    }
    /**************************************/

    function getMeta(region, bucket, prefix, ignoreError){
      var client = getClient({region:region, bucket:bucket});
      var p = client.head(prefix);
      if(!ignoreError)p.catch(handleError);
      return p;
    }
    function getContent(region, bucket, prefix){
      var client = getClient({region:region, bucket:bucket});
      var p = client.get(prefix);
      p.catch(handleError);
      return p;
    }
    function saveContent(region, bucket, prefix, content){
      var client = getClient({region:region, bucket:bucket});
      var p = client.put(prefix, new OSS.Buffer(content));
      p.catch(handleError);
      return p;
    }

    function abortAllUploads(region,bucket, uploads){
      var df=$q.defer();
      var client = getClient({region:region, bucket:bucket});
      var len = uploads.length;
      var c=0;
      function dig(){
        if(c>=len){
          df.resolve();
          return;
        }
        client.abortMultipartUpload(uploads[c].name,uploads[c].uploadId).then(function(result){
          c++;
          dig();
        },function(err){
          df.reject(err);
        });
      }
      dig();
      return df.promise;
    }
    function listAllUploads(region, bucket){
      var maxUploads = 100;
      var client = getClient({region:region, bucket:bucket});
      var t=[];
      var df = $q.defer();
      function dig(opt){
        opt = angular.extend({prefix: '', 'max-uploads':maxUploads}, opt);
        client.listUploads(opt).then(function(result){
          t = t.concat(result.uploads);
          if(result.uploads.length==maxUploads){
            dig({'key-marker':result.nextKeyMarker, 'upload-id-marker':result.nextUploadIdMarker});
          }
          else{
            df.resolve(t);
          }
        }, function(err){
          df.reject(err);
        });
      }
      dig({});
      return df.promise;
    }
    // function listUploads(region, bucket, prefix){
    //   var client = getClient({region:region, bucket:bucket});
    //   var p = client.listUploads({prefix: '', 'max-uploads':5});
    //   p.catch(handleError);
    //   return p;
    // }

    function createFolder(region, bucket, prefix){
      var client = getClient({region:region, bucket:bucket});
      var p = client.put(prefix, new OSS.Buffer('a'));
      p.catch(handleError);
      return p;
    }
    function createBucket(region, bucket , acl){
      var df = $q.defer();
      var client = getClient({region:region});
      client.putBucket(bucket, region).then(function(result){
        client.putBucketACL(bucket, region, acl).then(function(){
          df.resolve(result);
        },function(err){
          df.reject(err);
          handleError(err);
        });
      },function(err){
        df.reject(err);
        handleError(err);
      });
      return df.promise;
    }

    function getBucketACL(region, bucket){
      var client = getClient({region:region, bucket:bucket});
      var p = client.getBucketACL(bucket, region);
      p.catch(handleError);
      return p;
    }
    function updateBucketACL(region, bucket, acl){
      var client = getClient({region:region, bucket:bucket});
      var p = client.putBucketACL(bucket, region, acl);
      p.catch(handleError);
      return p;
    }

    function getACL(region, bucket, key){
      var client = getClient({region:region, bucket:bucket});
      var p = client.getACL(key);
      p.catch(handleError);
      return p;
    }
    function updateACL(region, bucket,key, acl){
      var client = getClient({region:region, bucket:bucket});
      var p = client.putACL(key, acl);
      p.catch(handleError);
      return p;
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
            listFiles(region, bucket, item.path).then(function(arr2){

              progress.total+=arr2.length;
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


            // console.log('delete---',item.path)
            // c++;
            // setTimeout(function(){
            //   progress.current++;
            //   dig();
            // },1000)


            client.delete(item.path).then(function(){
              c++;
              progress.current++;
              dig();
            },function(err){
              terr.push({item:item, error:err});
              progress.errorCount++;
              c++;
              dig();
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

    function deleteBucket(region,bucket){
      var p = getClient({region:region}).deleteBucket(bucket, region);
      p.catch(handleError);
      return p;
    }

    function listAllBuckets(){
      var client = getClient();
      var p = deepList(client.listBuckets, null, 'buckets');
      p.catch(handleError);
      return p;
    }

    function listFiles(region, bucket, key, folderOnly){
      var client = getClient({bucket:bucket, region:region});
      var opt = {prefix:key, delimiter: '/'};
      var p = deepList(client.list, opt, 'objects', folderOnly);
      p.catch(handleError);
      return p;
    }

    function handleError(err) {
      if(err.code=='InvalidAccessKeyId'){
        $state.go('login');
      }else{

        if(!err.code){
          if(err.message.indexOf('Failed to fetch')!=-1){
            err={code:'Error',message:'无法连接'};
          }
          else err={code:'Error',message:err.message};
        }

        Toast.error(err.code+': '+err.message);
      }
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

    function deepList(callFn, opt, resultKey, folderOnly){

      var df = $q.defer();
      var t=[], t_pre=[];
      function _dig(){
        callFn(opt||{}).then(function(result){

          if(result.prefixes){
            //目录
            result.prefixes.forEach(function(n){
              t_pre.push({
                name: n.substring(opt.prefix.length).replace(/(\/$)/,''),
                path: n,
                //size: 0,
                isFolder: true,
                itemType: 'folder',
              });
            });
          }

          if(result[resultKey]){
            //文件
            if(resultKey=='objects'){
              if(!folderOnly)
              result['objects'].forEach(function(n){
                if(n.name!=opt.prefix){
                  n.isFile= true;
                  n.itemType='file';
                  n.path = n.name;
                  n.name = n.name.substring(opt.prefix.length);
                  t.push(n);
                }
              });
            }
            else{
              //bucket
              result[resultKey].forEach(function(n){
                n.isBucket=true;
                n.itemType='bucket';
              });
              t = t.concat(result[resultKey]);
            }
          }

          if(result.nextMarker){
            opt.marker=result.nextMarker;
            _dig();
          }
          else{
            df.resolve(t_pre.concat(t));
          }
        },function(err){
          df.reject(err);
        });
      }
      _dig();
      return df.promise;
    }


    /**
    * @param opt   {object|string}
    *    object = {id, secret, region or endpoint, bucket}
    *    string = bucket
    */
    function getClient(opt){

      var authInfo = AuthInfo.get();
      //console.log($rootScope.bucketMap)
      var bucket;
      if(opt){
        if(typeof(opt)=='object'){
           angular.extend(authInfo, opt);
           bucket = opt.bucket;
        }
      }

      var endpoint = getOssEndpoint( authInfo.region||'oss-cn-beijing', bucket);

      var client = new OSS.Wrapper({
        accessKeyId: authInfo.id||'a',
        accessKeySecret: authInfo.secret||'a',
        //region: region,
        endpoint: endpoint,
        bucket: bucket
      });
      return client;
    }

    function getOssEndpoint(region, bucket){
      var isHttps = Global.ossEndpointProtocol=='https:';
      //通过bucket获取endpoint
      if(bucket && $rootScope.bucketMap && $rootScope.bucketMap[bucket]){
          var endpoint = $rootScope.bucketMap[bucket].extranetEndpoint;
          if(endpoint) return isHttps?('https://' + endpoint+':443'):('http://' + endpoint);
      }

      //region是domain
      if(region.indexOf('.')!=-1){
        if(region.indexOf('http')!=0){
          region = Global.ossEndpointProtocol=='https:'?('https://' + region+':443'):('http://' + region);
        }
        return region;
      }

      //region
      if(Global.ossEndpointProtocol=='https:'){
         return 'https://' + region + '.aliyuncs.com:443';
      }
      return 'http://' + region + '.aliyuncs.com';
    }

  }]);

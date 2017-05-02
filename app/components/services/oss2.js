angular.module('web')
  .factory('ossSvs2', ['$q','$rootScope','$state','Toast','Const','AuthInfo',
  function ( $q, $rootScope, $state, Toast, Const, AuthInfo) {
    var AUTH_INFO = Const.AUTH_INFO_KEY;
    var DEF_ADDR = 'oss://';
    //var ALY = require('aliyun-sdk');
    var path = require('path');

    return {
      createBucket: createBucket,
      restoreFile: restoreFile,
      getFileInfo: getFileInfo,
      listAllBuckets: listAllBuckets,

      parseRestoreInfo: parseRestoreInfo
    };
    function createBucket(region, bucket , acl, storageClass){

      return new Promise(function(a,b){
        var client = getClient({region:region,bucket: bucket});
        client.createBucket({
          Bucket: bucket,
          CreateBucketConfiguration: {
             StorageClass: storageClass
          }
        }, function(err, data){
          if(err){
            handleError(err);
            b(err);
          }else{
            client.putBucketAcl({
              Bucket: bucket,
              ACL: acl
            }, function(err, data){
              if(err){
                handleError(err);
                b(err);
              }else{
                a(data);
              }
            });
          }
        });
      });
    }

    function getFileInfo(region, bucket, key){
      return new Promise(function(a,b){
        var client = getClient({region:region, bucket: bucket});
        var opt = {Bucket:bucket,Key:key};
        client.headObject(opt, function(err, data){

          if(err){
            handleError(err);
            b(err);
          }else{
            a(data);
          }
        });
      });
    }



    function restoreFile(region, bucket, key, days){
      return new Promise(function(a,b){
        var client = getClient({region:region, bucket: bucket});
        var opt = {Bucket:bucket,Key:key, RestoreRequest: {Days: days||7}};
        client.restoreObject(opt, function(err, data){
          //console.log(err, data);
          if(err){
            handleError(err);
            b(err);
          }else{
            a(data);
          }
        });
      });
    }

    function listAllBuckets(){
      var client = getClient();
      var p = deepList(client,'listBuckets', {}, 'Buckets');
      p.catch(handleError);
      return p;
    }


    function deepList( client, callFn, opt, resultKey, folderOnly){

      var df = $q.defer();
      var t=[], t_pre=[];
      function _dig(){
        client[callFn].call(client, opt||{}, function(err, result){

          if(err){
            df.reject(err);
            return;
          }

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
            if(resultKey=='Objects'){
              if(!folderOnly)
              result['Objects'].forEach(function(n){
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
                n.creationDate = n.CreationDate;
                n.region = n.Location;
                n.name = n.Name;
                n.extranetEndpoint = n.ExtranetEndpoint;
                n.intranetEndpoint = n.IntranetEndpoint;
                n.storageClass = n.StorageClass;

                n.isBucket=true;
                n.itemType='bucket';
              });
              t = t.concat(result[resultKey]);
            }
          }

          if(result.NextMarker){
            opt.marker=result.NextMarker;
            _dig();
          }
          else{
            df.resolve(t_pre.concat(t));
          }
        });
      }
      _dig();
      return df.promise;
    }

    function parseRestoreInfo(s){
      //"ongoing-request="true"
      var arr = s.match(/([\w\-]+)=\"([^\"]+)\"/g);
      var m={};
      angular.forEach(arr, function(n){
        var kv = n.match(/([\w\-]+)=\"([^\"]+)\"/);
        m[kv[1]] = kv[2];
      });
      return m;
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


    /**
    * @param opt   {object|string}
    *    object = {id, secret, region, bucket}
    */
    function getClient(opt){

      var authInfo = AuthInfo.get();
      var bucket;
      if(opt){
        if(typeof(opt)=='object'){
           angular.extend(authInfo, opt);
           bucket = opt.bucket;
        }
      }

      var endpoint = getOssEndpoint( authInfo.region||'oss-cn-beijing', bucket);

      var client = new ALY.OSS({
        accessKeyId: authInfo.id||'a',
        secretAccessKey: authInfo.secret||'a',
        endpoint: endpoint,
        apiVersion: '2013-10-15'
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

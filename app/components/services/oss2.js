angular.module('web')
  .factory('ossSvs2', ['$q','$state','Toast','Const','AuthInfo',
  function ( $q, $state, Toast, Const, AuthInfo) {
    var AUTH_INFO = Const.AUTH_INFO_KEY;
    var DEF_ADDR = 'oss://';
    //var ALY = require('aliyun-sdk');
    var path = require('path');

    return {
      createBucket: createBucket,
      restoreFile: restoreFile,
      getFileMeta: getFileMeta,
      listAllBuckets: listAllBuckets,

      parseRestoreInfo: parseRestoreInfo
    };
    function createBucket(region, bucket , acl, storageClass){

      return new Promise(function(a,b){
        var client = getClient({region:region});
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

    function getFileMeta(region, bucket, key){
      return new Promise(function(a,b){
        var client = getClient({region:region});
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
        var client = getClient({region:region});
        var opt = {Bucket:bucket,Key:key, RestoreRequest: {Days: days||7}};
        client.restoreObject(opt, function(err, data){
          console.log(err, data);
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
    *    object = {id, secret, region}
    */
    function getClient(opt){

      var authInfo = AuthInfo.get();
      if(opt){
        if(typeof(opt)=='object'){
           angular.extend(authInfo, opt);
        }
      }

      var region = authInfo.region||'oss-cn-beijing';
      //region = region.indexOf('oss-')!=0? 'oss-'+region : region;

      var client = new ALY.OSS({
        accessKeyId: authInfo.id||'a',
        secretAccessKey: authInfo.secret||'a',
        endpoint: getOssEndpoint(region),
        apiVersion: '2013-10-15'
      });

      return client;
    }


    function getOssEndpoint(region){
      if(Global.ossEndpointProtocol=='https:'){
         return 'https://' + region + '.aliyuncs.com:443';
      }
      return 'http://' + region + '.aliyuncs.com';
    }

  }]);

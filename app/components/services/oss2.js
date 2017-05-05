angular.module('web')
  .factory('ossSvs2', ['$q', '$rootScope','$timeout', '$state', 'Toast', 'Const', 'AuthInfo',
    function ($q, $rootScope, $timeout, $state, Toast, Const, AuthInfo) {
      var AUTH_INFO = Const.AUTH_INFO_KEY;
      var DEF_ADDR = 'oss://';
      //var ALY = require('aliyun-sdk');
      var path = require('path');

      return {
        createBucket: createBucket,
        restoreFile: restoreFile,
        getFileInfo: getFileInfo,
        listAllBuckets: listAllBuckets,

        listFiles: listFiles, 
        getContent: getContent,
        saveContent: saveContent,

        parseRestoreInfo: parseRestoreInfo
      };

      function getContent(region, bucket, key){
        return new Promise(function (a, b) {
          var client = getClient({region:region, bucket:bucket}); 
          client.getObject({
            Bucket: bucket,
            Key: key
          }, function(err, data){ 
            if(err){
              handleError(err);
              b(err);
            }else{
              a(data);
            }
          });
        });   
      }

      function saveContent(region, bucket, key, content){
         return new Promise(function (a, b) {
          var client = getClient({
            region: region,
            bucket: bucket
          });
          client.putObject({
            Bucket: bucket, 
            Key: key,
            Body: content
          }, function(err){
            if(err){
               handleError(err);
              b(err);
            }else{
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
            //console.log(err, data);
            if (err) {
              handleError(err);
              b(err);
            } else {
              a(data);
            }
          });
        });
      }

      function listAllBuckets() {
        var client = getClient();
        var p = deepList(client, 'listBuckets', {}, 'Buckets');
        p.catch(handleError);
        return p;
      }

 

      //同一时间只能有一个查询，上一个查询如果没有完成，则会被abort
      var keepListFilesJob;
      function listFiles(region, bucket, key, folderOnly) {

        if (keepListFilesJob) {
          keepListFilesJob.abort();
          keepListFilesJob = null;
        }

        return new Promise(function (a, b) {
          keepListFilesJob = new deepListJob(region, bucket, key, folderOnly, function(data){
             
             a(data)
          }, function(err){
            handleError(err);
             b(err)
          }); 
        }); 
      }

      function deepListJob(region, bucket, key, folderOnly, succFn, errFn) {
        var stopFlag=false;

        var client = getClient({
          region: region,
          bucket: bucket
        });

        var endpoint = $rootScope.bucketMap[bucket].extranetEndpoint;

        var t = [];
        var t_pre = [];
        var opt = {
          Bucket: bucket,
          Prefix: key,
          Delimiter: '/'
        };
        _dig();

        function _dig() {
          if(stopFlag)return;
          client.listObjects(opt, function (err, result) {
            if(stopFlag)return;
            if (err) {
              errFn(err);
              return;
            }


            var prefix = opt.Prefix;
            if(!prefix.endsWith('/')){
              prefix = prefix.substring(0, prefix.lastIndexOf('/')+1)
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
                  n.name =  n.Key.substring(prefix.length);
                  n.size = n.Size;
                  n.storageClass = n.StorageClass;
                  n.type = n.Type;
                  n.url = 'http://'+ opt.Bucket+'.'+endpoint+'/'+ n.Key;
 
                  t.push(n);
                }
              });
            }
            //console.log(result)
            if (result.NextMarker) {
              opt.Marker = result.NextMarker;
              $timeout(_dig, 10);
            } else {
              if(stopFlag)return;
              succFn(t_pre.concat(t));
            }
          });
        }

        //////////////////////////
        this.abort = function () {
           stopFlag = true;
        }
      }

      function listFiles2(region, bucket, key, folderOnly) {
        var client = getClient({
          region: region,
          bucket: bucket
        });
        var p = deepList(client, 'listObjects', {
          Bucket: bucket,
          Prefix: key,
          Delimiter: '/'
        }, 'Contents', folderOnly);
        p.catch(handleError);
        return p;
      }

      function deepList(client, callFn, opt, resultKey, folderOnly) {

        var df = $q.defer();
        var t = [],
          t_pre = [];

        function _dig() {
          client[callFn].call(client, opt || {}, function (err, result) {

            if (err) {
              df.reject(err);
              return;
            }

            if (result.CommonPrefixes) {
              //目录
              result.CommonPrefixes.forEach(function (n) {
                n = n.Prefix;
                t_pre.push({
                  name: n.substring(opt.Prefix.length).replace(/(\/$)/, ''),
                  path: n,
                  //size: 0,
                  isFolder: true,
                  itemType: 'folder'
                });
              });
            }

            if (result[resultKey]) {
              //文件
              if (resultKey == 'Contents') {
                if (!folderOnly)
                  result['Contents'].forEach(function (n) {
                    n.Prefix = n.Prefix || '';
                    if (n.Key != opt.Prefix) {
                      n.isFile = true;
                      n.itemType = 'file';
                      n.path = n.Key;
                      n.name = n.Key.substring(opt.Prefix.length);
                      n.size = n.Size;
                      n.storageClass = n.StorageClass;
                      n.type = n.Type;
                      t.push(n);
                    }
                  });
              } else {
                //bucket
                result[resultKey].forEach(function (n) {
                  n.creationDate = n.CreationDate;
                  n.region = n.Location;
                  n.name = n.Name;
                  n.extranetEndpoint = n.ExtranetEndpoint;
                  n.intranetEndpoint = n.IntranetEndpoint;
                  n.storageClass = n.StorageClass;

                  n.isBucket = true;
                  n.itemType = 'bucket';
                });
                t = t.concat(result[resultKey]);
              }
            }

            if (result.NextMarker) {
              opt.Marker = result.NextMarker;
              _dig();
            } else {
              df.resolve(t_pre.concat(t));
            }
          });
        }
        _dig();
        return df.promise;
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

          Toast.error(err.code + ': ' + err.message);
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

        var client = new ALY.OSS({
          accessKeyId: authInfo.id || 'a',
          secretAccessKey: authInfo.secret || 'a',
          endpoint: endpoint,
          apiVersion: '2013-10-15'
        });

        return client;
      }

      function getOssEndpoint(region, bucket) {
        var isHttps = Global.ossEndpointProtocol == 'https:';
        //通过bucket获取endpoint
        if (bucket && $rootScope.bucketMap && $rootScope.bucketMap[bucket]) {
          var endpoint = $rootScope.bucketMap[bucket].extranetEndpoint;
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
          return 'https://' + region + '.aliyuncs.com:443';
        }
        return 'http://' + region + '.aliyuncs.com';
      }

    }
  ]);
angular.module('web')
  .factory('ossSvs2', ['$q', '$rootScope', '$timeout', '$state', 'Toast', 'Const', 'AuthInfo',
    function ($q, $rootScope, $timeout, $state, Toast, Const, AuthInfo) {
      var AUTH_INFO = Const.AUTH_INFO_KEY;
      var DEF_ADDR = 'oss://';
      //var ALY = require('aliyun-sdk');
      var path = require('path');

      return {
        createBucket: createBucket,
        restoreFile: restoreFile,
        getFileInfo: getFileInfo, //head object
        listAllBuckets: listAllBuckets,

        listAllFiles: listAllFiles,
        listFiles: listFiles,
        getContent: getContent,
        saveContent: saveContent,

        getACL: getACL,

        parseRestoreInfo: parseRestoreInfo
      };

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

      async function listFiles(region, bucket, key, marker) {

        var result = await _listFilesOrigion(region, bucket, key, marker);
        var arr = result.data;
        if (arr && arr.length) { 
          $timeout( ()=> {
            asyncLoadStorageStatus(region, bucket, arr);
          }); 
        }
        return result;
      }
      
      async function asyncLoadStorageStatus(region, bucket, arr){
         for (var item of arr) {
            if (!item.isFile || item.storageClass != 'Archive') continue;

            var data = await getFileInfo(region, bucket, item.path)
            //console.log(data);
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
          }
          //console.log('----------done-----------')
      }

      function _listFilesOrigion(region, bucket, key, marker) {

        return new Promise(function (resolve, reject) {
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
                  n.url = 'http://' + opt.Bucket + '.' + endpoint + '/' + n.Key;

                  t.push(n);
                }
              });
            }

            //console.log(result)
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
                  n.url = 'http://' + opt.Bucket + '.' + endpoint + '/' + n.Key;

                  t.push(n);
                }
              });
            }
            //console.log(result)
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
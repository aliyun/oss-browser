angular.module('web').factory('ossSvs2', [
  '$q',
  '$rootScope',
  '$timeout',
  '$state',
  'Toast',
  'Const',
  'AuthInfo',
  'settingsSvs',
  function($q, $rootScope, $timeout, $state, Toast, Const, AuthInfo, settingsSvs) {
    var NEXT_TICK = 1;
    var stopDeleteFilesFlag = false;
    var stopCopyFilesFlag = false;
    // 同一时间只能有一个查询，上一个查询如果没有完成，则会被abort
    // eslint-disable-next-line no-unused-vars
    var keepListFilesJob;

    var DEF_ADDR = 'oss://';
    // var ALY = require('aliyun-sdk');
    // var path = require("path");
    var AliOSS = require('ali-oss');
    const platform = require('platform');
    // 打包后的文件app.js与package.json同级
    const pkg = require('./package.json');
    const USER_AGENT = `aliyun-sdk-ossbrowser-${platform.os}-${pkg.version}`;

    return {
      createFolder: createFolder,
      createBucket: createBucket,
      restoreFile: restoreFile,
      loadStorageStatus: loadStorageStatus,

      getMeta: getMeta2,
      getFileInfo: getMeta2, // head object
      setMeta: setMeta,
      setMeta2: setMeta2,

      checkFileExists: checkFileExists,
      checkFolderExists: checkFolderExists,

      listAllBuckets: listAllBuckets,

      listAllFiles: listAllFiles,
      listFiles: listFiles,
      getContent: getContent,
      saveContent: saveContent,
      getImageBase64Url: getImageBase64Url,
      loadObjectSymlinkMeta: loadObjectSymlinkMeta,
      putObjectSymlinkMeta,

      // 重命名
      moveFile: moveFile,
      // 复制，移动
      copyFiles: copyFiles,
      stopCopyFiles: stopCopyFiles,

      // 删除
      deleteFiles: deleteFiles,

      // 删除文件
      deleteMultiFiles: deleteMultiFiles,
      // 删除文件夹
      deleteFolder: deleteFolder,
      stopDeleteFiles: stopDeleteFiles,

      // 碎片
      listAllUploads: listAllUploads,
      abortAllUploads: abortAllUploads,

      deleteBucket: deleteBucket,

      // 自有域名列表
      listAllCustomDomains: listAllCustomDomains,
      // 可用加速域名列表
      listUsableAccelarateDomains: listUsableAccelarateDomains,

      getBucketACL: getBucketACL,
      updateBucketACL: updateBucketACL,
      getACL: getACL,
      updateACL: updateACL,

      getClient: getClient,
      parseOSSPath: parseOSSPath,
      getOssEndpoint: getOssEndpoint,
      parseRestoreInfo: parseRestoreInfo,
      signatureUrl: signatureUrl,

      getClient2: getClient2,
      getClient3: getClient3,
      signatureUrl2: signatureUrl2
    };

    function getClient2(opt) {
      var options = prepaireOptions(opt);
      const OSS = require('ali-oss/dist/aliyun-oss-sdk');
      var client = new OSS({
        accessKeyId: options.accessKeyId,
        accessKeySecret: options.secretAccessKey,
        endpoint: options.endpoint,
        bucket: opt.bucket,
        stsToken: options.securityToken,
        cname: options.cname,
        isRequestPay: options.isRequestPayer
      });

      client.userAgent = USER_AGENT;

      return client;
    }

    function getClient3(opt) {
      const options = prepaireOptions(opt);
      const final = {
        accessKeyId: options.accessKeyId,
        accessKeySecret: options.secretAccessKey,
        bucket: opt.bucket,
        endpoint: options.endpoint,
        region: opt.region,
        timeout: options.httpOptions.timeout,
        cname: options.cname,
        isRequestPay: options.isRequestPayer
      };

      if (Object.prototype.hasOwnProperty.call(options, 'securityToken')) {
        final.stsToken = options.securityToken;
      }

      const client = new AliOSS(final);

      client.userAgent = USER_AGENT;

      return client;
    }

    function signatureUrl2(region, bucket, key, expires, xprocess) {
      var client = getClient2({
        region: region,
        bucket: bucket
      });

      return client.signatureUrl(key, {
        expires: expires,
        process: xprocess
      });
    }

    function checkFileExists(region, bucket, key) {
      return new Promise(function(a, b) {
        var client = getClient({
          region: region,
          bucket: bucket
        });
        var opt = {
          Bucket: bucket,
          Key: key
        };

        client.headObject(opt, function(err, data) {
          if (err) {
            b(err);
          } else {
            a(data);
          }
        });
      });
    }

    function checkFolderExists(region, bucket, prefix) {
      const client = getClient3({
        region: region,
        bucket: bucket
      });

      return client
          .listV2({
            prefix: prefix,
            'max-keys': 1
          })
          .then((res) => {
            if (res.keyCount != 0) {
              return true;
            }

            return false;
          });
    }

    function stopDeleteFiles() {
      stopDeleteFilesFlag = true;
    }

    /**
     * 批量删除文件或目录
     * @param region {string}
     * @param bucket {string}
     * @param items   {array}  item={path,isFolder}
     * @param progCb  {function} 可选， 进度回调  (current,total)
     */
    function deleteFiles(region, bucket, items, progCb) {
      stopDeleteFilesFlag = false;

      var client = getClient3({
        region: region,
        bucket: bucket
      });
      const progress = {
        current: 0,
        total: 0,
        errorCount: 0
      };
      const files = [];
      const folders = [];

      items.forEach((item) => {
        if (item.isFile) {
          files.push(item.path);
        } else if (item.isFolder && item.path) {
          folders.push(item.path);
        }
      });
      let p = [];

      if (folders.length) {
        p = p.concat(
            folders.map((folder) => () => deleteFolder({ region, bucket, folder, progCb, progress }))
        );
      }

      if (files.length) {
        p.push(() => deleteMultiFiles({ region, bucket, files, progCb, progress }));
      }

      return Promise.all(
          p.map(
              i => i()
                  .then(value => ({ status: 'fulfilled', value }))
                  ['catch'](reason => ({ status: 'rejected', reason }))
          )
      ).then(v => {
        const fulfilled = [];
        let rejected = [];

        if (v && v.length) {
          v.forEach(i => {
            if (i.status === 'fulfilled') {
              fulfilled.push(i.value);
            } else {
              i.status === 'rejected';

              if (Array.isArray(i.reason)) {
                rejected = rejected.concat(i.reason);
              }

              rejected.push(i.reason);
            }
          });
        }

        if (rejected && rejected.length) {
          throw rejected;
        }

        return fulfilled;
      });
    }

    /**
     * 删除某个文件夹
     * @param region {string}
     * @param bucket {string}
     * @param folder  {string} 目录
     * @param progCb  {function} 可选， 进度回调  (current,total, errorCount)
     */
    function deleteFolder({ region, bucket, folder, marker, progCb, progress }) {
      const client = getClient3({ region: region, bucket: bucket });
      const options = { prefix: folder, 'max-keys': 1000 };

      if (stopDeleteFilesFlag) {
        throw {
          item: {
            isFolder: true,
            path: folder
          },
          error: new Error('User cancelled')
        };
      }

      return new Promise((resolve, reject) => {
        let listFinish = false;
        const listDeleteFolder = (token) => {
          if (stopDeleteFilesFlag) {
            reject({
              item: {
                isFolder: true,
                path: folder
              },
              error: new Error('User cancelled')
            });

            return;
          }

          return client.listV2(Object.assign({}, options, { 'continuation-token': token }))
              .then(({ objects = [], nextContinuationToken, isTruncated }) => {
                if (stopDeleteFilesFlag) {
                  reject({
                    item: {
                      isFolder: true,
                      path: folder
                    },
                    error: new Error('User cancelled')
                  });

                  return;
                }

                const files = objects.map(i => i.name);

                if (files && files.length) {
                  progress.total += files.length;

                  if (progCb) { progCb(progress); }

                  client.deleteMulti(files).then(() => {
                    progress.current += files.length;
                    progCb(progress);

                    if (listFinish && progress.current + progress.errorCount === progress.total) {
                      resolve();
                    }
                  })['catch']((e) => {
                    progress.errorCount += files.length;
                    console.error('删除失败', e);
                  });
                }

                if (nextContinuationToken) {
                  return listDeleteFolder(nextContinuationToken);
                }

                listFinish = true;

                return '';
              })['catch'](() => {
                reject();
              });
        };

        listDeleteFolder('');
      });
    }
    /**
     * 删除多个文件
     * @param region {string}
     * @param bucket {string}
     * @param files  {string[]} 文件数组
     * @param progCb  {function} 可选， 进度回调  (current,total, errorCount)
     */
    function deleteMultiFiles({ region, bucket, files, progCb, progress }) {
      const client = getClient3({
        region: region,
        bucket: bucket
      });
      const CHUNK_SIZE = 1000;

      return new Promise((resolve, reject) => {
        const chunk = files.reduce((rows, key, index) =>
          (index % CHUNK_SIZE == 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows,
        []);

        chunk.forEach((chunkFiles, index) => {
          progress.total += chunkFiles.length;

          if (stopDeleteFilesFlag) {
            reject(chunkFiles.map((i) => {
              return {
                item: {
                  isFile: true,
                  path: i
                },
                error: new Error('User cancelled')
              };
            }));

            return;
          }

          client.deleteMulti(chunkFiles).then(() => {
            progress.current += chunkFiles.length;
            progCb(progress);

            if (index === chunk.length - 1) {
              resolve();
            }
          })['catch']((e) => {
            progress.errorCount += files.length;
            console.error('删除失败', e);
            reject(e);
          });
        });
      });
    }

    function stopCopyFiles() {
      stopCopyFilesFlag = true;
    }

    /**
     * 批量复制或移动文件
     * @param region {string} 要求相同region
     * @param items {array} 需要被复制的文件列表，可能为folder，可能为file
     * @param target {object} {bucket,key} 目标目录路径
     * @param progFn {Function} 进度回调  {current:1, total: 11, errorCount: 0}
     * @param removeAfterCopy {boolean} 移动flag，复制后删除。 默认false
     * @param renameKey {string} 重命名目录的 key。
     */
    function copyFiles(
        region,
        items,
        target,
        progFn,
        removeAfterCopy,
        renameKey
    ) {
      var progress = {
        total: 0,
        current: 0,
        errorCount: 0
      };

      stopCopyFilesFlag = false;

      // 入口
      var df = $q.defer();

      digArr(items, target, renameKey, function(terr) {
        df.resolve(terr);
      });

      return df.promise;

      // copy oss file
      function copyOssFile(client, from, to, fn) {
        var toKey = to.key;
        var fromKey = '/' + from.bucket + '/' + encodeURIComponent(from.key);

        console.info(
            removeAfterCopy ? 'move' : 'copy',
            '::',
            from.bucket + '/' + from.key,
            '==>',
            to.bucket + '/' + toKey
        );

        client.copyObject({
          Bucket: to.bucket,
          Key: toKey,
          CopySource: fromKey
        }, function(err) {
          if (err) {
            fn(err);

            return;
          }

          if (removeAfterCopy) {
            var client2 = getClient({
              region: region,
              bucket: from.bucket
            });

            client2.deleteObject(
                {
                  Bucket: from.bucket,
                  Key: from.key
                },
                function(err) {
                  if (err) { fn(err); } else { fn(); }
                }
            );
          } else {
            fn();
          }
        });
      }

      // 打平，一条一条 copy
      function doCopyOssFiles(bucket, pkey, arr, target, fn) {
        var len = arr.length;
        var c = 0;
        var t = [];

        progress.total += len;

        var client = getClient({
          region: region,
          bucket: target.bucket
        });

        function _dig() {
          if (c >= len) {
            $timeout(function() {
              fn(t);
            }, NEXT_TICK);

            return;
          }

          if (stopCopyFilesFlag) {
            df.resolve([
              {
                item: {},
                error: new Error('User cancelled')
              }
            ]);

            return;
          }

          var item = arr[c];
          var toKey = target.key.replace(/\/$/, '');

          toKey = (toKey ? toKey + '/' : '') + item.path.substring(pkey.length);

          copyOssFile(
              client,
              {
                bucket: bucket,
                key: item.path
              },
              {
                bucket: target.bucket,
                key: toKey
              },
              function(err) {
                if (err) {
                  progress.errorCount++;

                  if (progFn) {
                    try {
                      progFn(progress);
                    } catch (e) {
                    //
                    }
                  }

                  t.push({
                    item: item,
                    error: err
                  });
                }

                progress.current++;

                if (progFn) {
                  try {
                    progFn(progress);
                  } catch (e) {
                  //
                  }
                }

                c++;

                // fix ubuntu
                $timeout(_dig, NEXT_TICK);
              }
          );
        }

        _dig();
      }

      function doCopyFolder(source, target, fn) {
        var t = [];
        var client = getClient3({
          region: region,
          bucket: source.bucket
        });

        nextList();

        function nextList(marker) {
          var opt = {
            prefix: source.path
          };

          if (marker) { opt.continuationToken = marker; }

          client
              .listV2(opt)
              .then((result) => {
                if (!result.objects) { return; }

                const newTarget = {
                  key: target.key,
                  bucket: target.bucket
                };
                let objs = result.objects
                    .filter((n) => n.name !== opt.prefix)
                    .map((n) => {
                      return Object.assign({}, n, {
                        isFile: true,
                        itemType: 'file',
                        path: n.name,
                        name: n.name.replace(opt.prefix, '')
                      });
                    });

                if (result.objects && result.objects.length === 1 &&
                result.objects[0].name === opt.prefix && !result.isTruncated
                ) {
                // 如果只有一个空文件夹，需要单独重命名这个空文件夹，不能过滤掉
                  const file = result.objects[0];

                  objs = [Object.assign({}, file, {
                    isFile: true,
                    itemType: 'file',
                    path: file.name,
                    name: ''
                  })];
                }

                doCopyOssFiles(
                    source.bucket,
                    source.path,
                    objs,
                    newTarget,
                    function(terr) {
                      if (stopCopyFilesFlag) {
                        df.resolve([
                          {
                            item: {},
                            error: new Error('User cancelled')
                          }
                        ]);

                        return;
                      }

                      if (terr) { t = t.concat(terr); }

                      if (result.nextContinuationToken) {
                        $timeout(function() {
                          nextList(result.nextContinuationToken);
                        }, NEXT_TICK);
                      } else if (removeAfterCopy && terr.length == 0) {
                      // 移动全部成功， 删除目录
                        const client1 = getClient({
                          region: region,
                          bucket: source.bucket
                        });

                        client1.deleteObject(
                            {
                              Bucket: source.bucket,
                              Key: source.path
                            },
                            function() {
                              $timeout(function() {
                                fn(t);
                              }, NEXT_TICK);
                            }
                        );
                      } else {
                        $timeout(function() {
                          fn(t);
                        }, NEXT_TICK);
                      }
                    }
                );
              })
              ['catch']((err) => {
                t.push({
                  item: source,
                  error: err
                });
                $timeout(function() {
                  fn(t);
                }, NEXT_TICK);
              });
        }
      }

      function doCopyFile(source, target, fn) {
        var client = getClient({
          region: region,
          bucket: target.bucket
        });

        copyOssFile(
            client,
            {
              bucket: source.bucket,
              key: source.path
            },
            {
              bucket: target.bucket,
              key: target.key
            },
            function(err) {
              if (err) {
                fn(err);
              } else {
                fn();
              }
            }
        );
      }

      function digArr(items, target, renameKey, fn) {
        var len = items.length;
        var c = 0;
        var terr = [];

        progress.total += len;

        if (progFn) {
          try {
            progFn(progress);
          } catch (e) {
          //
          }
        }

        function _() {
          if (c >= len) {
            fn(terr);

            return;
          }

          if (stopCopyFilesFlag) {
            df.resolve([
              {
                item: {},
                error: new Error('User cancelled')
              }
            ]);

            return;
          }

          var item = items[c];
          var toKey = renameKey;

          if (!renameKey) {
            toKey = target.key.replace(/\/$/, '');
            toKey = (toKey ? toKey + '/' : '') + items[c].name;
          }

          var newTarget = {
            key: toKey, // target.key.replace(/\/$/,'')+'/'+items[c].name,
            bucket: target.bucket
          };

          c++;

          if (item.isFile) {
            doCopyFile(item, newTarget, function(err) {
              if (err) {
                progress.errorCount++;

                if (progFn) {
                  try {
                    progFn(progress);
                  } catch (e) {
                  //
                  }
                }

                terr.push({
                  item: items[c],
                  error: err
                });
              }

              progress.current++;

              if (progFn) {
                try {
                  progFn(progress);
                } catch (e) {
                //
                }
              }

              $timeout(_, NEXT_TICK);
            });
          } else {
            progress.total -= 1;
            doCopyFolder(item, newTarget, function(errs) {
              if (errs) {
                terr = terr.concat(errs);
              }

              if (progFn) {
                try {
                  progFn(progress);
                } catch (e) {
                //
                }
              }

              $timeout(_, NEXT_TICK);
            });
          }
        }

        _();
      }
    }

    // 移动文件，重命名文件
    function moveFile(region, bucket, oldKey, newKey, isCopy) {
      var df = $q.defer();
      var client = getClient({
        region: region,
        bucket: bucket
      });

      client.copyObject(
          {
            Bucket: bucket,
            Key: newKey,
            CopySource: '/' + bucket + '/' + encodeURIComponent(oldKey),
            MetadataDirective: 'COPY' // 'REPLACE' 表示覆盖 meta 信息，'COPY' 表示不覆盖，只拷贝,
          },
          function(err) {
            if (err) {
              df.reject(err);
              handleError(err);
            } else if (isCopy) {
              df.resolve();
            } else {
              client.deleteObject(
                  {
                    Bucket: bucket,
                    Key: oldKey
                  },
                  function(err) {
                    if (err) {
                      df.reject(err);
                      handleError(err);
                    } else { df.resolve(); }
                  }
              );
            }
          }
      );

      return df.promise;
    }

    /** ************************************/

    function listAllUploads(region, bucket) {
      var maxUploads = 100;
      var client = getClient({
        region: region,
        bucket: bucket
      });
      var t = [];
      var df = $q.defer();

      function dig(opt) {
        opt = angular.extend(
            {
              Bucket: bucket,
              Prefix: '',
              MaxUploads: maxUploads
            },
            opt
        );
        client.listMultipartUploads(opt, function(err, result) {
          if (err) {
            df.reject(err);

            return;
          }

          angular.forEach(result.Uploads, function(n) {
            n.initiated = n.Initiated;
            n.name = n.Key;
            n.storageClass = n.StorageClass;
            n.uploadId = n.UploadId;
          });

          t = t.concat(result.Uploads);

          if (result.Uploads.length == maxUploads) {
            $timeout(function() {
              dig({
                KeyMarker: result.NextKeyMarker,
                UploadIdMarker: result.NextUploadIdMarker
              });
            }, NEXT_TICK);
          } else {
            df.resolve(t);
          }
        });
      }

      dig({});

      return df.promise;
    }

    function abortAllUploads(region, bucket, uploads) {
      var df = $q.defer();
      var client = getClient({
        region: region,
        bucket: bucket
      });
      var len = uploads.length;
      var c = 0;

      function dig() {
        if (c >= len) {
          df.resolve();

          return;
        }

        client.abortMultipartUpload(
            {
              Bucket: bucket,
              Key: uploads[c].name,
              UploadId: uploads[c].uploadId
            },
            function(err) {
              if (err) { df.reject(err); } else {
                c++;
                $timeout(dig, NEXT_TICK);
              }
            }
        );
      }

      dig();

      return df.promise;
    }

    function createFolder(region, bucket, prefix) {
      return new Promise(function(a, b) {
        var client = getClient({
          region: region,
          bucket: bucket
        });

        client.putObject(
            {
              Bucket: bucket,
              Key: prefix,
              Body: ''
            },
            function(err, data) {
              if (err) {
                handleError(err);
                b(err);
              } else {
                a(data);
              }
            }
        );
      });
    }

    function deleteBucket(region, bucket) {
      return new Promise(function(a, b) {
        var client = getClient({
          region: region,
          bucket: bucket
        });

        client.deleteBucket(
            {
              Bucket: bucket
            },
            function(err, data) {
              if (err) {
                handleError(err);
                b(err);
              } else {
                a(data);
              }
            }
        );
      });
    }

    function signatureUrl(region, bucket, key, expiresSec) {
      var client = getClient({
        region: region,
        bucket: bucket
      });

      var url = client.getSignedUrl('getObject', {
        Bucket: bucket,
        Key: key,
        Expires: expiresSec || 60
      });

      return url;
    }

    function getBucketACL(region, bucket) {
      var df = $q.defer();
      var client = getClient({
        region: region,
        bucket: bucket
      });

      client.getBucketAcl(
          {
            Bucket: bucket
          },
          function(err, data) {
            if (err) {
              handleError(err);
              df.reject(err);
            } else {
              if (data.Grants && data.Grants.length == 1) {
                var t = [];

                for (var k in data.Grants[0]) {
                  t.push(data.Grants[0][k]);
                }

                data.acl = t.join('');
              } else {
                data.acl = 'default';
              }

              df.resolve(data);
            }
          }
      );

      return df.promise;
    }

    function updateBucketACL(region, bucket, acl) {
      var df = $q.defer();
      var client = getClient({
        region: region,
        bucket: bucket
      });

      client.putBucketAcl(
          {
            Bucket: bucket,
            ACL: acl
          },
          function(err, data) {
            if (err) {
              handleError(err);
              df.reject(err);
            } else {
              df.resolve(data);
            }
          }
      );

      return df.promise;
    }

    function getACL(region, bucket, key) {
      return new Promise(function(a, b) {
        var client = getClient({
          region: region,
          bucket: bucket
        });

        client.getObjectAcl(
            {
              Bucket: bucket,
              Key: key
            },
            function(err, data) {
              if (err) {
                handleError(err);
                b(err);
              } else {
                if (data.Grants && data.Grants.length == 1) {
                  var t = [];

                  for (var k in data.Grants[0]) {
                    t.push(data.Grants[0][k]);
                  }

                  data.acl = t.join('');
                } else {
                  data.acl = 'default';
                }

                a(data);
              }
            }
        );
      });
    }

    function updateACL(region, bucket, key, acl) {
      return new Promise(function(a, b) {
        var client = getClient({
          region: region,
          bucket: bucket
        });

        client.putObjectAcl(
            {
              Bucket: bucket,
              Key: key,
              ACL: acl
            },
            function(err, data) {
              if (err) {
                handleError(err);
                b(err);
              } else {
                a(data);
              }
            }
        );
      });
    }

    function getImageBase64Url(region, bucket, key) {
      return new Promise(function(a, b) {
        var client = getClient({
          region: region,
          bucket: bucket
        });

        client.getObject(
            {
              Bucket: bucket,
              Key: key
            },
            function(err, data) {
              if (err) {
                handleError(err);
                b(err);
              } else {
                a(data);
              }
            }
        );
      });
    }

    function getContent(region, bucket, key) {
      return new Promise(function(a, b) {
        const client = getClient3({
          region: region,
          bucket: bucket
        });

        client
            .get(key)
            .then((resp) => {
              a(resp);
            })
            ['catch']((err) => {
              handleError(err);
              b(err);
            });
      });
    }

    function saveContent(region, bucket, key, content, isCodeSave) {
      return new Promise(function(resolve, reject) {
        // aliyun sdk, browser
        const client = getClient({
          region: region,
          bucket: bucket
        });
        // ali-oss, node
        const client3 = getClient3({
          region: region,
          bucket: bucket
        });

        Promise.all([
          new Promise((resolve, reject) => {
            client.headObject({ Bucket: bucket, Key: key }, (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          }),
          client3.getACL(key),
          client3.getObjectTagging(key)
        ]).then(([headResult, aclResult, taggingResult])=> {
          let tagging = '';

          if (taggingResult && taggingResult.tag) {
            tagging = Object.keys(taggingResult.tag).map(function(k) {
              return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
            }).join('&');
          }

          let encoding = headResult.ContentEncoding;
          // code-modal保存时，如果encoding=gzip，就不变更gzip，避免内容未做gzip压缩，导致sdk中的urllib响应内容解析失败
          if(isCodeSave && encoding === 'gzip'){
            encoding=undefined;
          }

          client3.put(key, new Buffer(content), {
            mime: headResult.ContentType,
            meta: headResult.Metadata,
            headers: {
              'Content-Disposition': headResult.ContentDisposition,
              'Content-Encoding': encoding,
              'Cache-Control': headResult.CacheControl,
              'Content-Language': headResult.ContentLanguage,
              'x-oss-storage-class': headResult.StorageClass,
              'x-oss-object-acl': aclResult.acl,
              'x-oss-tagging': tagging
            }
          }).then(resolve)['catch'](e => {
            handleError(e);
            reject(e);
          });
        })['catch'](e => {
          handleError(e);
          reject(e);
        });

        // client.headObject({ Bucket: bucket, Key: key }, function (err, result) {
        //   if (err) {
        //     handleError(err);
        //     reject(err);
        //   } else {
        // client.putObject({
        //     Bucket: bucket,
        //     Key: key,
        //     Body: content,
        //
        //     //保留http头
        //     ContentLanguage: result.ContentLanguage,
        //     ContentType: result.ContentType,
        //     CacheControl: result.CacheControl,
        //     ContentDisposition: result.ContentDisposition,
        //     ContentEncoding: "",
        //     Expires: result.Expires,
        //     Metadata: result.Metadata,
        //   }, function (err) {
        //     if (err) {
        //       handleError(err);
        //       reject(err);
        //     } else {
        //       resolve();
        //     }
        //   }
        // );
        //   }
        // });
      });
    }

    function createBucket(region, bucket, acl, storageClass) {
      return new Promise(function(a, b) {
        var client = getClient({
          region: region,
          bucket: bucket
        });

        client.createBucket(
            {
              Bucket: bucket,
              CreateBucketConfiguration: {
                StorageClass: storageClass
              }
            },
            function(err) {
              if (err) {
                handleError(err);
                b(err);
              } else {
                client.putBucketAcl(
                    {
                      Bucket: bucket,
                      ACL: acl
                    },
                    function(err, data) {
                      if (err) {
                        handleError(err);
                        b(err);
                      } else {
                        a(data);
                      }
                    }
                );
              }
            }
        );
      });
    }

    function getMeta(region, bucket, key) {
      return new Promise(function(a, b) {
        var client = getClient({
          region: region,
          bucket: bucket
        });
        var opt = {
          Bucket: bucket,
          Key: key
        };

        client.headObject(opt, function(err, data) {
          if (err) {
            handleError(err);
            b(err);
          } else {
            a(data);
          }
        });
      });
    }

    function getMeta2(region, bucket, key) {
      const client = getClient3({ region, bucket });

      function adapter(obj) {
        const outputStructure = {
          AcceptRanges: {
            name: 'accept-ranges'
          },
          CacheControl: {
            name: 'Cache-Control'
          },
          ContentDisposition: {
            name: 'Content-Disposition'
          },
          ContentEncoding: {
            name: 'Content-Encoding'
          },
          ContentLanguage: {
            name: 'Content-Language'
          },
          ContentLength: {
            type: 'integer',
            name: 'Content-Length'
          },
          ContentType: {
            name: 'Content-Type'
          },
          DeleteMarker: {
            type: 'boolean',
            name: 'x-oss-delete-marker'
          },
          ETag: {
            name: 'ETag'
          },
          Expiration: {
            name: 'x-oss-expiration'
          },
          Expires: {
            type: 'timestamp',
            name: 'Expires'
          },
          LastModified: {
            type: 'timestamp',
            name: 'Last-Modified'
          },
          Restore: {
            name: 'x-oss-restore'
          },
          ServerSideEncryption: {
            name: 'x-oss-server-side-encryption'
          },
          VersionId: {
            name: 'x-oss-version-id'
          },
          WebsiteRedirectLocation: {
            name: 'x-oss-website-redirect-location'
          }
        };
        const output = {
          Metadata: obj.meta
        };
        const { hasOwnProperty } = Object.prototype;
        const headers = obj.res.headers;

        // extract output
        for (let key in outputStructure) {
          if (hasOwnProperty.call(outputStructure, key)) {
            const name = outputStructure[key].name.toLowerCase();

            if (headers[name] !== undefined) {
              output[key] = headers[name];
            }
          }
        }

        // extract x-oss-...
        for (let key in headers) {
          if (key.indexOf('x-oss-') == 0) {
            let arr = key.substring('x-oss-'.length).split('-');

            for (let i = 0; i < arr.length; i++) {
              arr[i] = arr[i][0].toUpperCase() + arr[i].substring(1);
            }

            output[arr.join('')] = headers[key];
          } else if (key === 'content-md5') {
            output.ContentMD5 = headers['content-md5'];
          }
        }

        // extract requestId
        output.RequestId =
          headers['x-oss-request-id'] || headers['x-oss-requestid'];

        return output;
      }

      return client.head(key).then((res) => {
        return adapter(res);
      });
    }

    function setMeta(region, bucket, key, headers, metas) {
      return new Promise(function(a, b) {
        var client = getClient({
          region: region,
          bucket: bucket
        });
        var opt = {
          Bucket: bucket,
          Key: key,
          CopySource: '/' + bucket + '/' + encodeURIComponent(key),
          MetadataDirective: 'REPLACE', // 覆盖meta

          Metadata: metas || {},

          ContentType: headers.ContentType,
          CacheControl: headers.CacheControl,
          ContentDisposition: headers.ContentDisposition,
          ContentEncoding: headers.ContentEncoding,
          ContentLanguage: headers.ContentLanguage,
          Expires: headers.Expires
        };

        client.copyObject(opt, function(err, data) {
          if (err) {
            handleError(err);
            b(err);
          } else {
            a(data);
          }
        });
      });
    }

    function setMeta2(region, bucket, key, headers, meta) {
      const client = getClient3({ region, bucket });

      return client
          .copy(key, key, {
            headers,
            meta
          })
          ['catch'](handleError);
    }

    function restoreFile(region, bucket, key, days) {
      return new Promise(function(a, b) {
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

        client.restoreObject(opt, function(err, data) {
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
      return new Promise(function(resolve, reject) {
        let ready = [];
        let ready_dirs = [];
        let ready_objects = [];

        function get(m) {
          return _listFilesOrigion(region, bucket, key, m).then((result) => {
            const { dirs, objects } = result.data;

            if (dirs.length || objects.length) {
              ready_dirs = ready_dirs.concat(dirs);
              ready_objects = ready_objects.concat(objects);
              ready = ready_dirs.concat(ready_objects);
            }

            return {
              data: ready,
              marker: result.marker,
              truncated: result.truncated,
              maxKeys: result.maxKeys
            };
          });
        }

        get(marker).then(function(result) {
          var arr = result.data;

          if (arr && arr.length) {
            $timeout(() => {
              loadStorageStatus(region, bucket, arr);
            }, NEXT_TICK);
          }

          resolve(result);
        }, reject);
      });
    }

    function loadStorageStatus(region, bucket, arr) {
      return new Promise(function(resolve, reject) {
        var len = arr.length;
        var c = 0;

        _dig();

        function _dig() {
          if (c >= len) {
            resolve();

            return;
          }

          var item = arr[c];

          c++;

          if (!item.isFile || item.storageClass != 'Archive') {
            _dig();

            return;
          }

          getMeta(region, bucket, item.path).then(
              function(data) {
                if (data.Restore) {
                  var info = parseRestoreInfo(data.Restore);

                  if (info['ongoing-request'] == 'true') {
                    item.storageStatus = 2; // '归档文件正在恢复中，请耐心等待...';
                  } else {
                    item.expired_time = info['expiry-date'];
                    item.storageStatus = 3; // '归档文件，已恢复，可读截止时间
                  }
                } else {
                  item.storageStatus = 1;
                }

                $timeout(_dig, NEXT_TICK);
              }, function(err) {
                _dig();
                reject(err);
              }
          );
        }
      });
    }

    function loadObjectSymlinkMeta(region, bucket, key) {
      const client = getClient3({ region, bucket });

      return new Promise((a, b) => {
        client
            .getSymlink(key)
            .then((data) => a(data))
            ['catch']((e) => {
              handleError(e);
              b(e);
            });
      });
    }

    function putObjectSymlinkMeta(region, bucket, key, targetName) {
      const client = getClient3({ region, bucket });

      return new Promise((a, b) => {
        client
            .putSymlink(key, targetName)
            .then((data) => a(data))
            ['catch']((e) => {
              handleError(e);
              b(e);
            });
      });
    }

    function _listFilesOrigion(region, bucket, key, marker = '', length = 1000) {
      const client = getClient3({
        region,
        bucket
      });
      const options = { prefix: key, delimiter: '/', 'max-keys': length };
      let data = {
        nextContinuationToken: '',
        objects: [],
        prefixes: [],
        keyCount: [],
        isTruncated: true
      };

      const processData = (resp) => {
        // 部分bucket 会返回 prefiex: ['/']， 需要进行过滤
        const dirs = (resp.prefixes || []).filter((n) => n !== key && n !== '/').map((n) => {
          const arr = n.split('/').filter((k) => !!k);
          const name = arr[arr.length - 1];

          return {
            isFolder: true,
            itemType: 'folder',
            path: n,
            name: name === '/' ? name : name.replace(/\/$/, '')
          };
        });
        const objects = (resp.objects || [])
            .filter((n) => n.name !== key)
            .map((n) => {
              const arr = n.name.split('/').filter((k) => !!k);
              const name = arr[arr.length - 1];

              return Object.assign(n, {
                isFile: true,
                itemType: 'file',
                path: n.name,
                name: name
              });
            });

        return {
          data: {
            dirs,
            objects
          },
          marker: resp.nextContinuationToken,
          truncated: resp.isTruncated
        };
      };

      return new Promise((resolve, reject) => {
        const list = (token) => {
          client.listV2(Object.assign({}, options, { 'continuation-token': token })).then(res => {
            if (res.objects && res.objects.length) {
              data.objects = data.objects.concat(res.objects);
            }

            if (res.prefixes && res.prefixes.length) {
              data.prefixes = data.prefixes.concat(res.prefixes);
            }

            data.keyCount += res.keyCount;
            data.isTruncated = res.isTruncated;
            data.nextContinuationToken = res.nextContinuationToken;

            if (res.isTruncated && res.nextContinuationToken && data.keyCount < length) {
              options['max-keys'] = length - data.keyCount;
              list(res.nextContinuationToken);
            } else {
              resolve(processData(data));
            }
          })['catch'](reject);
        };

        list(marker);
      });

      return client.listV2(Object.assign({}, options, { 'continuation-token': marker }))
          .then((resp) => {
            const dirs = (resp.prefixes || [])
                .filter((n) => n !== key)
                .map((n) => {
                  const arr = n.split('/').filter((k) => !!k);
                  const name = arr[arr.length - 1];

                  return {
                    isFolder: true,
                    itemType: 'folder',
                    path: n,
                    name: name === '/' ? name : name.replace(/\/$/, '')
                  };
                });
            const objects = (resp.objects || [])
                .filter((n) => n.name !== key)
                .map((n) => {
                  const arr = n.name.split('/').filter((k) => !!k);
                  const name = arr[arr.length - 1];

                  return Object.assign(n, {
                    isFile: true,
                    itemType: 'file',
                    path: n.name,
                    name: name
                  });
                });

            return {
              data: {
                dirs,
                objects
              },
              marker: resp.nextContinuationToken,
              truncated: resp.isTruncated,
              maxKeys: +resp.keyCount
            };
          })
          ['catch']((e) => {
            handleError(e);

            return Promise.reject(e);
          });
    }

    function listAllFiles(region, bucket, key, folderOnly) {
      const client = getClient3({ region, bucket });

      let all_dirs = [];
      let all_objects = [];

      function listMore(marker) {
        const options = {
          prefix: key,
          'max-keys': 1000
        };

        if (folderOnly) {
          options.delimiter = '/';
        }

        if (marker) {
          options['next-continuationToken'] = marker;
        }

        return client.listV2(options).then((resp) => {
          const dirs = (resp.prefixes || []).map((n) => {
            return {
              name: n,
              path: n,
              isFolder: true,
              itemType: 'folder'
            };
          });

          all_dirs = all_dirs.concat(dirs);

          if (!folderOnly && resp.objects) {
            const objects = (resp.objects || []).map((n) => {
              return Object.assign(n, {
                isFile: true,
                itemType: 'file',
                path: n.name,
                name: n.name.replace(options.prefix, '')
              });
            });

            all_objects = all_objects.concat(objects);
          }

          if (resp.nextContinuationToken) {
            return listMore(resp.nextContinuationToken);
          }

          return all_dirs.concat(all_objects);
        });
      }

      return listMore();
    }

    function listAllBuckets() {
      return new Promise(function(resolve, reject) {
        var client = getClient();

        var t = [];

        var opt = {};

        _dig();

        function _dig() {
          // opt.MaxKeys=50
          client.listBuckets(opt, function(err, result) {
            // console.log(opt, err, result)
            if (err) {
              handleError(err);
              reject(err);

              return;
            }

            // bucket
            if (result.Buckets) {
              result.Buckets.forEach(function(n) {
                n.creationDate = n.CreationDate;
                n.region = n.Location;
                n.name = n.Name;
                n.extranetEndpoint = n.ExtranetEndpoint;
                n.intranetEndpoint = n.IntranetEndpoint;
                n.storageClass = n.StorageClass;
                n.lastModified = n.LastModified;

                n.isBucket = true;
                n.itemType = 'bucket';
              });
              t = t.concat(result.Buckets);
            }
            // resolve(t);
            // console.log(result)

            if (result.NextMarker) {
              opt.Marker = result.NextMarker;
              $timeout(_dig, NEXT_TICK);
            } else {
              resolve(t);
            }
          });
        }
      });
    }

    function parseRestoreInfo(s) {
      // "ongoing-request="true"
      var arr = s.match(/([\w-]+)="([^"]+)"/g);
      var m = {};

      angular.forEach(arr, function(n) {
        var kv = n.match(/([\w-]+)="([^"]+)"/);

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
          } else {
            err = {
              code: 'Error',
              message: err.message
            };
          }
        }

        if (
          err.code == 'NetworkingError' &&
          err.message.indexOf('ENOTFOUND') != -1
        ) {
          console.error(err);
        } else { Toast.error(err.code + ': ' + err.message, undefined, err.requestId); }
      }

      return Promise.reject(err);
    }

    /**
     * @param opt   {object|string}
     *    object = {id, secret, region, bucket}
     */
    function getClient(opt) {
      var options = prepaireOptions(opt);

      ALY.util.xUserAgent = () => USER_AGENT;
      var client = new ALY.OSS(options);

      return client;
    }

    function prepaireOptions(opt) {
      var authInfo = AuthInfo.get();

      var bucket;

      if (opt) {
        if (typeof opt === 'object') {
          angular.extend(authInfo, opt);
          bucket = opt.bucket;
        }
      }

      var endpointname = authInfo.cname ? authInfo.eptplcname : authInfo.eptpl;
      var endpoint = getOssEndpoint(
          authInfo.region || 'oss-cn-beijing',
          bucket,
          endpointname
      );

      console.log('[endpoint]:', endpoint);
      const timeout = settingsSvs.connectTimeout.get();
      const options = {
        // region: authInfo.region,
        accessKeyId: authInfo.id || 'a',
        secretAccessKey: authInfo.secret || 'a',
        endpoint: endpoint,
        apiVersion: '2013-10-15',
        httpOptions: {
          timeout: authInfo.httpOptions ? authInfo.httpOptions.timeout : timeout
        },
        maxRetries: 50,
        cname: authInfo.cname || false,
        isRequestPayer: authInfo.requestpaystatus != 'NO'
      };

      if (authInfo.id && authInfo.id.indexOf('STS.') == 0) {
        options.securityToken = authInfo.stoken || null;
      }

      return options;
    }

    function parseOSSPath(ossPath) {
      if (!ossPath || ossPath.indexOf(DEF_ADDR) == -1 || ossPath == DEF_ADDR) {
        return {};
      }

      var str = ossPath.substring(DEF_ADDR.length);
      var ind = str.indexOf('/');
      let bucket;
      let key;

      if (ind == -1) {
        bucket = str;
        key = '';
      } else {
        bucket = str.substring(0, ind);
        key = str.substring(ind + 1);
      }

      return {
        bucket: bucket,
        key: key
      };
    }

    // eslint-disable-next-line no-unused-vars
    function getOssUrl(region, bucket, key) {
      var eptpl = AuthInfo.get().eptpl || 'http://{region}.aliyuncs.com';

      var protocol = eptpl.indexOf('https:') == 0 ? 'https:' : 'http:'; // Global.ossEndpointProtocol == 'https:';

      if (bucket && $rootScope.bucketMap && $rootScope.bucketMap[bucket]) {
        var endpoint =
          $rootScope.bucketMap[bucket][
              $rootScope.internalSupported
                ? 'intranetEndpoint'
                : 'extranetEndpoint'
          ];

        if (endpoint) {
          // return 'http://'+ endpoint + '/' + key;
          return protocol + '//' + bucket + '.' + endpoint + '/' + key;
          // return isHttps ? (protocol+'//'+ bucket+'.'+ endpoint  +'/' + key) : ('http://'+ endpoint + '/' + key);
        }
      }

      // region是domain
      if (region) {
        if (region.indexOf('.') != -1) {
          if (region.indexOf('http') == -1) {
            region = protocol + '//' + bucket + '.' + region + '/' + key;
          }

          return region;
        }

        return (
          protocol + '//' + bucket + '.' + region + '.aliyuncs.com' + '/' + key
        );
      }

      let domain;

      if (eptpl.indexOf('https://') == 0) {
        domain = eptpl.substring(8, eptpl.length);
        domain.replace(/\/$/, '');

        return protocol + '//' + bucket + '.' + domain + '/' + key;
      }

      if (eptpl.indexOf('http://') == 0) {
        domain = eptpl.substring(7, eptpl.length);
        domain.replace(/\/$/, '');

        return protocol + '//' + bucket + '.' + domain + '/' + key;
      }

      return (
        protocol + '//' + bucket + '.' + region + '.aliyuncs.com' + '/' + key
      );
    }

    function getOssEndpoint(region, bucket, eptpl) {
      eptpl = eptpl || AuthInfo.get().eptpl || 'http://{region}.aliyuncs.com';

      // 通过bucket获取endpoint
      if (bucket && $rootScope.bucketMap && $rootScope.bucketMap[bucket]) {
        var endpoint =
          $rootScope.bucketMap[bucket][
              $rootScope.internalSupported
                ? 'intranetEndpoint'
                : 'extranetEndpoint'
          ];

        if (endpoint) {
          return eptpl.indexOf('https://') == 0
            ? 'https://' + endpoint
            : 'http://' + endpoint;
        }
      }

      eptpl = eptpl.replace('{region}', region);

      return eptpl;

      //
      // //region是domain
      // if (region && region.indexOf('.') != -1) {
      //   if (region.indexOf('http') != 0) {
      //     region = Global.ossEndpointProtocol == 'https:' ? ('https://' + region + ':443') : ('http://' + region);
      //   }
      //   return region;
      // }
      //
      // //region
      // if (Global.ossEndpointProtocol == 'https:') {
      //   return $rootScope.internalSupported
      //       ?'https://' + region + '-internal.aliyuncs.com:443'
      //       :'https://' + region + '.aliyuncs.com:443';
      // }
      // return $rootScope.internalSupported
      //       ? 'http://' + region + '-internal.aliyuncs.com'
      //       : 'http://' + region + '.aliyuncs.com';
    }

    function listAllCustomDomains(bucket, options) {
      const client = getClient2({
        bucket: bucket
      });

      client.getCnameList = async function getCnameList(name) {
        const params = {
          method: 'GET',
          bucket: name,
          subres: 'cname',
          timeout: options && options.timeout,
          ctx: options && options.ctx,
          successStatuses: [200]
        };
        const result = await this.request(params);
        const { Cname = [] } = await this.parseXML(result.data);

        if (!Array.isArray(Cname)) {
          return [Cname.Domain];
        }

        return Cname.map((_) => _.Domain);
      };

      return client.getCnameList(bucket);
    }

    function listUsableAccelarateDomains(bucket) {
      const acc_endpoints = [
        'oss-accelerate.aliyuncs.com',
        'oss-accelerate-overseas.aliyuncs.com'
      ];
      const store = getClient3({ bucket });
      const urlutil = require('url');

      store.options.endpoint = urlutil.parse(`https://${acc_endpoints[0]}`);
      store.options.cname = false;

      return store
          .list({
            'max-keys': 1
          })
          .then(() => acc_endpoints)
          ['catch'](() => []);
    }
  }
]);

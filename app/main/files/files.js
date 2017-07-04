angular.module('web')
  .controller('filesCtrl', ['$scope', '$rootScope', '$uibModal', '$timeout', 'AuthInfo', 'ossSvs2', 'settingsSvs', 'fileSvs', 'safeApply', 'Toast', 'Dialog',
    function ($scope, $rootScope, $modal, $timeout, AuthInfo, ossSvs2, settingsSvs, fileSvs, safeApply, Toast, Dialog) {

      angular.extend($scope, {
        showTab: 1,
        ref: {
          isBucketList: false,
          isListView: true
        },

        keepMoveOptions: null,

        sch: {
          bucketName: '',
          objectName: ''
        },
        searchObjectName: searchObjectName,

        goIn: goIn,

        transVisible: localStorage.getItem('transVisible') == 'true',
        toggleTransVisible: function (f) {
          $scope.transVisible = f;
          localStorage.setItem('transVisible', f);
        },

        //object 相关
        showAddFolder: showAddFolder,
        showDeleteFiles: showDeleteFiles,
        showDeleteFilesSelected: showDeleteFilesSelected,
        showRename: showRename,
        showMove: showMove,

        //bucket相关
        showDeleteBucket: showDeleteBucket,
        showAddBucket: showAddBucket,
        showUpdateBucket: showUpdateBucket,
        showBucketMultipart: showBucketMultipart,

        //全选相关
        sel: {
          hasArchive: false,
          all: false, //boolean
          has: false, //[] item: ossObject={name,path,...}
          x: {} //{} {'i_'+$index, true|false}
        },
        selectAll: selectAll,
        selectChanged: selectChanged,

        //bucket 单选
        bucket_sel: {
          item: null
        },
        selectBucket: selectBucket,

        //上传， 下载
        handlers: {
          uploadFilesHandler: null,
          downloadFilesHandler: null
        },
        handlerDrop: handlerDrop, //拖拽释放
        showUploadDialog: showUploadDialog,
        showDownloadDialog: showDownloadDialog,

        //预览 编辑
        showPreview: showPreview,
        //item 下载
        showDownload: showDownload,

        //授权
        showGrant: showGrant,
        showGrantToken: showGrantToken,
        //地址
        showAddress: showAddress,
        showACL: showACL,

        showRestore: showRestore,

        loadNext: loadNext,

        showPaste: showPaste,
        cancelPaste: cancelPaste,
        getCurrentOssPath: getCurrentOssPath,

        mock: {
          uploads: '',
          downloads: '',
          uploadsChange: uploadsChange,
          downloadsChange: downloadsChange,
        }
      });

      var tid_uploads;
      function uploadsChange(){
        $timeout.cancel(tid_uploads);
        tid_uploads = $timeout(function(){
          if($scope.mock.uploads){
            var arr = $scope.mock.uploads.split(',');
            $scope.handlers.uploadFilesHandler(arr, $scope.currentInfo);
          }
        },600);
      }
      var tid_downloads;
      function downloadsChange(){
        $timeout.cancel(tid_downloads);
        tid_downloads = $timeout(function(){
          if($scope.mock.downloads){
            _downloadMulti($scope.mock.downloads);
          }
        },600);
      }



      var ttid;
      $scope.$on('needrefreshfilelists', function (e) {
        console.log('on:needrefreshfilelists');
        $timeout.cancel(ttid);
        ttid = $timeout(function () {
          goIn($scope.currentInfo.bucket, $scope.currentInfo.key);
        }, 600);
      });

      $timeout(init, 100);

      function init() {
        var authInfo = AuthInfo.get();

        $scope.currentAuthInfo = authInfo;

        if (authInfo.osspath) {
          $scope.ref.isBucketList = false;
          //bucketMap
          $rootScope.bucketMap = {};
          var bucket = ossSvs2.parseOSSPath(authInfo.osspath).bucket;
          $rootScope.bucketMap[bucket] = {
            region: authInfo.region
          };

          $timeout(function () {
            addEvents();
            //$rootScope.$broadcast('ossAddressChange', authInfo.osspath);
            $scope.$broadcast('filesViewReady');
          });

        } else {

          $scope.ref.isBucketList = true;
          listBuckets(function () {
            addEvents();
            $scope.$broadcast('filesViewReady');
          });
        }

      }

      //按名称过滤
      var ttid2;

      function searchObjectName() {
        $timeout.cancel(ttid2);
        ttid2 = $timeout(function () {
          var info = angular.copy($scope.currentInfo);
          info.key += $scope.sch.objectName;
          listFiles(info);
        }, 600);

      }

      function addEvents() {
        $scope.$on('ossAddressChange', function (e, addr, forceRefresh) {
          console.log('on:ossAddressChange:',addr, 'forceRefresh:',forceRefresh);

          var info = ossSvs2.parseOSSPath(addr);

          if (info.key) {
            var lastGan = info.key.lastIndexOf('/');

            if (info.key && lastGan != info.key.length - 1) {
              //if not endswith /
              var fileKey = info.key;
              var fileName = info.key.substring(lastGan + 1);
              info.key = info.key.substring(0, lastGan + 1);
            }
          }

          $scope.currentInfo = info;

          if (info.bucket) {

            //has bucket , list objects
            $scope.currentBucket = info.bucket;
            if (!$rootScope.bucketMap[info.bucket]) {
              Toast.error('No permission');

              clearObjectsList();

              return;
            }
            info.region = $rootScope.bucketMap[info.bucket].region;
            $scope.ref.isBucketList = false;

            if (fileName) {
              //search
              $scope.sch.objectName = fileName;
              searchObjectName();

            } else {
              listFiles();
            }

          } else {

            //list buckets
            $scope.currentBucket = null;
            $scope.ref.isBucketList = true;
            //只有从来没有 list buckets 过，才list，减少http请求开销
            if (!$scope.buckets && forceRefresh) listBuckets();

            clearObjectsList();
          }
        });
      }

      function goIn(bucket, prefix) {
        var ossPath = 'oss://';

        if (bucket) {
          ossPath = 'oss://' + bucket + '/' + (prefix || '');
        }
        $rootScope.$broadcast('goToOssAddress', ossPath);
      }

      function listFiles(info, marker, fn) {

        clearObjectsList();

        info = info || $scope.currentInfo;

        $scope.isLoading = true;

        doListFiles(info, marker, function (err) {
          $scope.isLoading = false;
          safeApply($scope);
        });
      }

      function doListFiles(info, marker, fn) {

        ossSvs2.listFiles(info.region, info.bucket, info.key, marker || '').then(function (result) {

          var arr = settingsSvs.showImageSnapshot.get() == 1 ? signPicURL(info, result.data) : result.data;

          $scope.objects = $scope.objects.concat(arr);
          $scope.nextObjectsMarker = result.marker || null;

          safeApply($scope);
          if (fn) fn(null);
        }, function (err) {
          console.log(err)
          clearObjectsList();

          if (fn) fn(err);
        });
      }

      function loadNext() {

        if ($scope.nextObjectsMarker) {
          console.log('loadNext')
          doListFiles($scope.currentInfo, $scope.nextObjectsMarker);
        }
      }

      function clearObjectsList(){
        initSelect();
        $scope.objects = [];
        $scope.nextObjectsMarker = null;
      }

      function signPicURL(info, result) {
        angular.forEach(result, function (n) {
          if (!n.isFolder && fileSvs.getFileType(n).type == 'picture') {
            n.pic_url = ossSvs2.signatureUrl(info.region, info.bucket, n.path, 3600);
          }
        });
        return result;
      }

      function listBuckets(fn) {
        $scope.isLoading = true;
        ossSvs2.listAllBuckets().then(function (buckets) {
          $scope.isLoading = false;
          $scope.buckets = buckets;

          var m = {};
          angular.forEach(buckets, function (n) {
            m[n.name] = n;
          });
          $rootScope.bucketMap = m;

          if (fn) fn();

        }, function (err) {
          console.log(err)
          $scope.isLoading = false;

          clearObjectsList();

          $scope.buckets = [];
          $rootScope.bucketMap = {};

          if (fn) fn();
        });
      }

      function showDeleteBucket(item) {
        Dialog.confirm('删除Bucket', 'Bucket名称:<code>' + item.name + '</code>, 所在区域:<code>' + item.region + '</code>, 确定删除？', function (b) {
          if (b) {
            ossSvs2.deleteBucket(item.region, item.name).then(function () {
              Toast.success('删除Bucket成功');
              //删除Bucket不是实时的，等待1秒后刷新
              $timeout(function () {
                listBuckets();
              }, 1000);
            });
          }
        }, 1);
      }

      function showDeleteFilesSelected() {
        showDeleteFiles($scope.sel.has);
      }

      function showDeleteFiles(items) {
        $modal.open({
          templateUrl: 'main/files/modals/delete-files-modal.html',
          controller: 'deleteFilesModalCtrl',
          backdrop: 'static',
          resolve: {
            items: function () {
              return items;
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
            callback: function () {
              return function () {
                listFiles();
              };
            }
          }
        });
      }

      function showAddBucket() {
        $modal.open({
          templateUrl: 'main/files/modals/add-bucket-modal.html',
          controller: 'addBucketModalCtrl',
          resolve: {
            item: function () {
              return null;
            },
            callback: function () {
              return function () {
                Toast.success('创建Bucket成功');
                //创建Bucket不是实时的，等待1秒后刷新
                $timeout(function () {
                  listBuckets();
                }, 1000);
              };
            }
          }
        });
      }

      function showAddFolder() {
        $modal.open({
          templateUrl: 'main/files/modals/add-folder-modal.html',
          controller: 'addFolderModalCtrl',
          resolve: {
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
            callback: function () {
              return function () {
                Toast.success('创建目录成功');
                listFiles();
              };
            }
          }
        });
      }

      function showUpdateBucket(item) {
        $modal.open({
          templateUrl: 'main/files/modals/update-bucket-modal.html',
          controller: 'updateBucketModalCtrl',
          resolve: {
            item: function () {
              return item;
            },
            callback: function () {
              return function () {
                Toast.success('修改Bucket权限成功');
                listBuckets();
              };
            }
          }
        });
      }

      function showBucketMultipart(item) {
        $modal.open({
          templateUrl: 'main/files/modals/bucket-multipart-modal.html',
          controller: 'bucketMultipartModalCtrl',
          size: 'lg',
          backdrop: 'static',
          resolve: {
            bucketInfo: function () {
              return item;
            }
          }
        });
      }

      function showPreview(item, type) {

        var fileType = fileSvs.getFileType(item);
        fileType.type = type || fileType.type;
        //console.log(fileType);

        //type: [picture|code|others|doc]

        var templateUrl = 'main/files/modals/preview/others-modal.html';
        var controller = 'othersModalCtrl';
        var backdrop = true;

        if (fileType.type == 'code') {
          templateUrl = 'main/files/modals/preview/code-modal.html';
          controller = 'codeModalCtrl';
          backdrop = 'static';
        } else if (fileType.type == 'picture') {
          templateUrl = 'main/files/modals/preview/picture-modal.html';
          controller = 'pictureModalCtrl';
          //backdrop = 'static';
        }
        else if (fileType.type == 'video') {
          templateUrl = 'main/files/modals/preview/media-modal.html';
          controller = 'mediaModalCtrl';
        }
        else if (fileType.type == 'audio') {
          templateUrl = 'main/files/modals/preview/media-modal.html';
          controller = 'mediaModalCtrl';
        }
        // else if(fileType.type=='doc'){
        //   templateUrl= 'main/files/modals/preview/doc-modal.html';
        //   controller= 'docModalCtrl';
        // }

        $modal.open({
          templateUrl: templateUrl,
          controller: controller,
          size: 'lg',
          //backdrop: backdrop,
          resolve: {
            bucketInfo: function () {
              return angular.copy($scope.currentInfo);
            },
            objectInfo: function () {
              return item;
            },
            fileType: function () {
              return fileType;
            },
            showFn: function () {
              return {
                callback: function () {
                  listFiles();
                },
                preview: showPreview,
                download: function () {
                  showDownload(item);
                },
                grant: function () {
                  showGrant([item]);
                },
                move: function (isCopy) {
                  showMove([item], isCopy);
                },
                remove: function () {
                  showDeleteFiles([item]);
                },
                rename: function () {
                  showRename(item);
                },
                address: function () {
                  showAddress(item);
                },
                acl: function () {
                  showACL(item);
                },
                crc: function () {
                  showCRC(item);
                }
              };
            }
          }
        });
      }

      function showCRC(item) {

        $modal.open({
          templateUrl: 'main/files/modals/crc-modal.html',
          controller: 'crcModalCtrl',
          resolve: {
            item: function () {
              return angular.copy(item);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            }
          }
        });
      }

      function showDownload(item) {
        var bucketInfo = angular.copy($scope.currentInfo);
        var fromInfo = angular.copy(item);

        fromInfo.region = bucketInfo.region;
        fromInfo.bucket = bucketInfo.bucket;

        Dialog.showDownloadDialog(function (folderPaths) {

          if (!folderPaths || folderPaths.length == 0) return;

          var to = folderPaths[0];
          to = to.replace(/(\/*$)/g, '');

          $scope.handlers.downloadFilesHandler([fromInfo], to);
        });
      }


      ////////////////////////
      function initSelect() {
        $scope.sel.all = false;
        $scope.sel.has = false;
        $scope.sel.x = {};
      }

      function selectAll() {
        var f = $scope.sel.all;
        $scope.sel.has = f ? $scope.objects : false;
        var len = $scope.objects.length;
        for (var i = 0; i < len; i++) {
          $scope.sel.x['i_' + i] = f;
        }
      }

      var lastSeleteIndex = -1;

      function selectChanged(e, index) {
        //批量选中
        if (e && e.shiftKey) {
          var min = Math.min(lastSeleteIndex, index);
          var max = Math.max(lastSeleteIndex, index);
          for (var i = min; i <= max; i++) {
            $scope.sel.x['i_' + i] = true;
          }
        }

        var len = $scope.objects.length;
        var all = true;
        var has = false;
        for (var i = 0; i < len; i++) {
          if (!$scope.sel.x['i_' + i]) {
            all = false;
          } else {
            if (!has) has = [];
            has.push($scope.objects[i]);
          }
        }
        $scope.sel.all = all;
        $scope.sel.has = has;

        lastSeleteIndex = index;
      }
      ////////////////////////////////

      function selectBucket(item) {
        if ($scope.bucket_sel.item == item) {
          $scope.bucket_sel.item = null;
        } else {
          $scope.bucket_sel.item = item;
        }
      }

      //上传下载
      var oudtid, oddtid;

      function showUploadDialog() {
        if (oudtid) return;
        oudtid = true;
        $timeout(function () {
          oudtid = false;
        }, 600);

        Dialog.showUploadDialog(function (filePaths) {
          if (!filePaths || filePaths.length == 0) return;
          $scope.handlers.uploadFilesHandler(filePaths, $scope.currentInfo);
        });
      }

      function showDownloadDialog() {
        if (oddtid) return;
        oddtid = true;
        $timeout(function () {
          oddtid = false;
        }, 600);

        Dialog.showDownloadDialog(function (folderPaths) {

          if (!folderPaths || folderPaths.length == 0 || !$scope.sel.has) return;

          var to = folderPaths[0];
          _downloadMulti(to);
        });
      }

      function _downloadMulti(to){
        to = to.replace(/(\/*$)/g, '');

        var fromArr = angular.copy($scope.sel.has);
        angular.forEach(fromArr, function (n) {
          n.region = $scope.currentInfo.region;
          n.bucket = $scope.currentInfo.bucket;
        });

        /**
         * @param fromOssPath {array}  item={region, bucket, path, name, size }
         * @param toLocalPath {string}
         */
        $scope.handlers.downloadFilesHandler(fromArr, to);
      }

      /**
       * 监听 drop
       * @param e
       * @returns {boolean}
       */
      function handlerDrop(e) {

        var files = e.originalEvent.dataTransfer.files;
        var filePaths = [];
        if (files) {
          angular.forEach(files, function (n) {
            filePaths.push(n.path);
          });
        }

        $scope.handlers.uploadFilesHandler(filePaths, $scope.currentInfo);
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      //授权
      function showGrant(items) {
        $modal.open({
          templateUrl: 'main/files/modals/grant-modal.html',
          controller: 'grantModalCtrl',
          resolve: {
            items: function () {
              return items;
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            }
          }
        });
      }

      //生成授权码
      function showGrantToken(item) {
        $modal.open({
          templateUrl: 'main/files/modals/grant-token-modal.html',
          controller: 'grantTokenModalCtrl',
          resolve: {
            item: function () {
              return item;
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            }
          }
        });
      }

      //重命名
      function showRename(item) {
        $modal.open({
          templateUrl: 'main/files/modals/rename-modal.html',
          controller: 'renameModalCtrl',
          backdrop: 'static',
          resolve: {
            item: function () {
              return angular.copy(item);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
            callback: function () {
              return function () {
                listFiles();
              };
            }
          }
        });
      }

      function getCurrentOssPath(){
        return 'oss://'+$scope.currentInfo.bucket+'/'+$scope.currentInfo.key
      }
      function cancelPaste(){
        $scope.keepMoveOptions=null;
        safeApply($scope);
      }
      function showPaste(){
        if($scope.keepMoveOptions.originPath==getCurrentOssPath()){
          $scope.keepMoveOptions = null;
          return;
        }
        var keyword = $scope.keepMoveOptions.isCopy ? '<span class="text-primary">复制</span>' : '<span class="text-danger">移动</span>';

        var msg = '将 <span class="text-info">'+$scope.keepMoveOptions.items[0].name
            + ($scope.keepMoveOptions.items.length>1?' 等':' ')
            + '</span> ' + keyword+' 到';

        msg+= '<br/><span class="text-warning">(oss://'+$scope.currentInfo.bucket+'/'+ $scope.currentInfo.key+')</span>目录下面?';


        Dialog.confirm(keyword, msg, function(b){
          if(b){
             $modal.open({
               templateUrl: 'main/files/modals/move-modal.html',
               controller: 'moveModalCtrl',
               backdrop: 'static',
               resolve: {
                 items: function () {
                   return angular.copy($scope.keepMoveOptions.items);
                 },
                 moveTo: function(){
                   return angular.copy($scope.currentInfo);
                 },
                 isCopy: function () {
                   return $scope.keepMoveOptions.isCopy;
                 },
                 fromInfo: function () {
                   return angular.copy($scope.keepMoveOptions.currentInfo);
                 },
                 callback: function () {
                   return function () {
                     $scope.keepMoveOptions = null;
                     listFiles();
                   };
                 }
               }
             });
           }
        });
      }

      //移动
      function showMove(items, isCopy) {

        $scope.keepMoveOptions = {
          items: items,
          isCopy: isCopy,
          currentInfo: angular.copy($scope.currentInfo),
          originPath : getCurrentOssPath()
        };

      }
      //地址
      function showAddress(item) {
        $modal.open({
          templateUrl: 'main/files/modals/get-address.html',
          controller: 'getAddressModalCtrl',
          resolve: {
            item: function () {
              return angular.copy(item);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            }
          }
        });
      }

      //acl
      function showACL(item) {
        $modal.open({
          templateUrl: 'main/files/modals/update-acl-modal.html',
          controller: 'updateACLModalCtrl',
          resolve: {
            item: function () {
              return angular.copy(item);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            }
          }
        });
      }

      function showRestore(item) {
        $modal.open({
          templateUrl: 'main/files/modals/restore-modal.html',
          controller: 'restoreModalCtrl',
          resolve: {
            item: function () {
              return angular.copy(item);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
            callback: function () {
              return function () {
                listFiles();
              };
            }
          }
        });
      }


    }
  ]);

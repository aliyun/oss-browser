angular
  .module("web")
  .filter("canSetHeader", function () {
    return (sel) =>
      sel && sel.has && sel.has.length && sel.has.every((f) => !f.isFolder);
  })
  .controller("filesCtrl", [
    "$scope",
    "$rootScope",
    "$uibModal",
    "$timeout",
    "$translate",
    "$sce",
    "AuthInfo",
    "ossSvs2",
    "settingsSvs",
    "fileSvs",
    "safeApply",
    "Toast",
    "Dialog",
    function (
      $scope,
      $rootScope,
      $modal,
      $timeout,
      $translate,
      $sce,
      AuthInfo,
      ossSvs2,
      settingsSvs,
      fileSvs,
      safeApply,
      Toast,
      Dialog
    ) {
      var T = $translate.instant;
      angular.extend($scope, {
        showTab: 1,
        ref: {
          isBucketList: false,
          isListView: true,
        },

        keepMoveOptions: null,
        isMac: os.platform() == "darwin",

        sch: {
          bucketName: "",
          objectName: "",
        },
        searchObjectName: searchObjectName,
        objects: [],

        goIn: goIn,

        transVisible: localStorage.getItem("transVisible") == "true",
        toggleTransVisible: function (f) {
          $scope.transVisible = f;
          localStorage.setItem("transVisible", f);
        },

        //object 相关
        showAddFolder: showAddFolder,
        showDeleteFiles: showDeleteFiles,
        showRestoreBatch: showRestoreBatch,
        showDeleteFilesSelected: showDeleteFilesSelected,
        showRename: showRename,
        showMove: showMove,
        showSymlink: showSymlink,

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
          x: {}, //{} {'i_'+$index, true|false}
        },
        selectAll: selectAll,
        selectChanged: selectChanged,

        //bucket 单选
        bucket_sel: {
          item: null,
        },
        selectBucket: selectBucket,

        //上传， 下载
        handlers: {
          uploadFilesHandler: null,
          downloadFilesHandler: null,
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
        showUserList: showUserList,
        //地址
        showAddress: showAddress,
        showACL: showACL,

        showHttpHeaders: showHttpHeaders,

        showRestore: showRestore,

        loadNext: loadNext,

        showPaste: showPaste,
        cancelPaste: cancelPaste,
        getCurrentOssPath: getCurrentOssPath,

        mock: {
          uploads: "",
          downloads: "",
          uploadsChange: uploadsChange,
          downloadsChange: downloadsChange,
        },

        objectLengthI18nTip: "",
        loadObjectSymlinkMeta,
        getSymlinkTooltipTpl,
      });

      if ($scope.isMac) {
        $scope.fileSpacerMenuOptions = [
          [
            function () {
              return '<i class="fa fa-upload text-info"></i> ' + T("upload");
            },
            function ($itemScope, $event) {
              showUploadDialog();
            },
            function () {
              return $scope.currentAuthInfo.privilege != "readOnly";
            },
          ],
        ];
      } else {
        $scope.fileSpacerMenuOptions = [
          [
            function () {
              return '<i class="fa fa-upload text-info"></i> ' + T("file");
            },
            function ($itemScope, $event) {
              showUploadDialog();
            },
            function () {
              return $scope.currentAuthInfo.privilege != "readOnly";
            },
          ],

          [
            function () {
              return '<i class="fa fa-upload text-info"></i> ' + T("folder");
            },
            function ($itemScope, $event) {
              showUploadDialog(true);
            },
            function () {
              return $scope.currentAuthInfo.privilege != "readOnly";
            },
          ],
        ];
      }
      $scope.fileSpacerMenuOptions = $scope.fileSpacerMenuOptions.concat([
        [
          function () {
            return (
              '<i class="glyphicon glyphicon-plus text-success"></i> ' +
              T("folder.create")
            );
          },
          function ($itemScope, $event) {
            showAddFolder();
          },
          function () {
            return $scope.currentAuthInfo.privilege != "readOnly";
          },
        ],

        [
          function () {
            return (
              '<i class="fa fa-paste text-primary"></i> ' +
              T("paste") +
              ($scope.keepMoveOptions
                ? "(" + $scope.keepMoveOptions.items.length + ")"
                : "")
            );
          },
          function ($itemScope, $event) {
            showPaste();
          },
          function () {
            return $scope.keepMoveOptions;
          },
        ],
      ]);

      $scope.fileMenuOptions = function (item, $index) {
        if ($scope.sel.x["i_" + $index]) {
          //pass
        } else {
          $scope.objects.forEach(function (n, i) {
            $scope.sel.x["i_" + i] = false;
          });
          $scope.sel.x["i_" + $index] = true;
          selectChanged();
        }

        return [
          [
            function () {
              //download
              return (
                '<i class="fa fa-download text-primary"></i> ' + T("download")
              );
            },
            function ($itemScope, $event) {
              showDownloadDialog();
            },
            function () {
              return $scope.sel.has;
            },
          ],
          [
            function () {
              //copy
              return '<i class="fa fa-clone text-primary"></i> ' + T("copy");
            },
            function ($itemScope, $event) {
              showMove($scope.sel.has, true);
            },
            function () {
              return (
                $scope.sel.has && $scope.currentAuthInfo.privilege != "readOnly"
              );
            },
          ],

          [
            function () {
              //move
              return '<i class="fa fa-cut text-primary"></i> ' + T("move");
            },
            function ($itemScope, $event) {
              showMove($scope.sel.has);
            },
            function () {
              return (
                $scope.sel.has && $scope.currentAuthInfo.privilege != "readOnly"
              );
            },
          ],

          [
            function () {
              return '<i class="fa fa-edit text-info"></i> ' + T("rename");
            },
            function ($itemScope, $event) {
              showRename($scope.sel.has[0]);
            },
            function () {
              return (
                $scope.sel.has &&
                $scope.sel.has.length == 1 &&
                $scope.currentAuthInfo.privilege != "readOnly" &&
                $scope.sel.has[0].storageClass != "Archive"
              );
            },
          ],

          [
            function () {
              return '<i class="fa fa-shield text-success"></i> ' + T("acl");
            },
            function ($itemScope, $event) {
              showACL($scope.sel.has[0]);
            },
            function () {
              return (
                $scope.sel.has &&
                $scope.sel.has.length == 1 &&
                !$scope.sel.has[0].isFolder &&
                $scope.currentAuthInfo.privilege != "readOnly"
              );
            },
          ],

          [
            function () {
              return (
                '<i class="fa fa-shield text-warning"></i> ' + T("simplePolicy")
              );
            },
            function ($itemScope, $event) {
              showGrant($scope.sel.has);
            },
            function () {
              return (
                $scope.sel.has && $scope.currentAuthInfo.id.indexOf("STS.") != 0
              );
            },
          ],

          [
            function () {
              //生成授权码
              return (
                '<i class="fa fa-shield text-success"></i> ' + T("genAuthToken")
              );
            },
            function ($itemScope, $event) {
              showGrantToken($scope.sel.has[0]);
            },
            function () {
              return (
                $scope.sel.has &&
                $scope.sel.has.length == 1 &&
                $scope.sel.has[0].isFolder &&
                $scope.currentAuthInfo.id.indexOf("STS.") != 0
              );
            },
          ],

          [
            function () {
              //获取地址
              return '<i class="fa fa-download"></i> ' + T("getAddress");
            },
            function ($itemScope, $event) {
              showAddress($scope.sel.has[0]);
            },
            function () {
              return (
                $scope.sel.has &&
                $scope.sel.has.length == 1 &&
                !$scope.sel.has[0].isFolder &&
                $scope.currentAuthInfo.id.indexOf("STS.") != 0
              );
            },
          ],

          [
            function () {
              //Http头
              return '<i class="fa fa-cog"></i> ' + T("http.headers");
            },
            function ($itemScope, $event) {
              showHttpHeaders($scope.sel.has);
            },
            function () {
              return (
                $scope.sel.has &&
                $scope.sel.has.length &&
                $scope.sel.has.every((f) => !f.isFolder)
              );
            },
          ],

          [
            function () {
              // 设置软链接
              return '<i class="fa fa-link"></i>' + T("file.op.set_symlink");
            },
            function ($itemScope, $event) {
              showSymlink($scope.sel.has[0]);
            },
            function () {
              return (
                $scope.sel.has &&
                $scope.sel.has.length === 1 &&
                !$scope.sel.has[0].isFolder &&
                $scope.sel.has[0].type !== "Symlink"
              );
            },
          ],

          [
            function () {
              return '<i class="fa fa-remove text-danger"></i> ' + T("delete");
            },
            function ($itemScope, $event) {
              showDeleteFilesSelected();
            },
            function () {
              return (
                $scope.sel.has && $scope.currentAuthInfo.privilege != "readOnly"
              );
            },
          ],
        ];
      };
      $scope.bucketSpacerMenuOptions = [
        [
          function () {
            return (
              '<i class="glyphicon glyphicon-plus text-success"></i> ' +
              T("bucket.add")
            );
          },
          function ($itemScope, $event) {
            showAddBucket();
          },
        ],
      ];

      $scope.bucketMenuOptions = [
        [
          function ($itemScope, $event, modelValue, text, $li) {
            $scope.bucket_sel.item = $itemScope.item;
            return '<i class="fa fa-copy"></i> ' + T("bucket.multipart");
            // <!-- 碎片 -->
          },
          function ($itemScope, $event) {
            // Action
            showBucketMultipart($scope.bucket_sel.item);
          },
        ],

        [
          function ($itemScope, $event, modelValue, text, $li) {
            $scope.bucket_sel.item = $itemScope.item;
            return '<i class="fa fa-shield text-success"></i> ' + T("acl");
          },
          function ($itemScope, $event) {
            // Action
            showUpdateBucket($scope.bucket_sel.item);
          },
        ],

        [
          function ($itemScope, $event, modelValue, text, $li) {
            $scope.bucket_sel.item = $itemScope.item;
            return (
              '<i class="fa fa-shield text-warning"></i> ' + T("simplePolicy")
            );
          },
          function ($itemScope, $event) {
            // Action
            showGrant([$scope.bucket_sel.item]);
          },
        ],

        [
          function ($itemScope, $event, modelValue, text, $li) {
            $scope.bucket_sel.item = $itemScope.item;
            return '<i class="fa fa-remove text-danger"></i> ' + T("delete");
          },
          function ($itemScope, $event) {
            // Action
            showDeleteBucket($scope.bucket_sel.item);
          },
        ],
      ];

      /////////////////////////////////

      var tid_uploads;
      function uploadsChange() {
        $timeout.cancel(tid_uploads);
        tid_uploads = $timeout(function () {
          if ($scope.mock.uploads) {
            var arr = $scope.mock.uploads.split(",");
            $scope.handlers.uploadFilesHandler(arr, $scope.currentInfo);
          }
        }, 600);
      }
      var tid_downloads;
      function downloadsChange() {
        $timeout.cancel(tid_downloads);
        tid_downloads = $timeout(function () {
          if ($scope.mock.downloads) {
            _downloadMulti($scope.mock.downloads);
          }
        }, 600);
      }

      var ttid;
      $scope.$on("needrefreshfilelists", function (e) {
        console.log("on:needrefreshfilelists");
        $timeout.cancel(ttid);
        ttid = $timeout(function () {
          goIn($scope.currentInfo.bucket, $scope.currentInfo.key);
        }, 600);
      });

      $timeout(init, 100);

      function init() {
        var authInfo = AuthInfo.get();

        $rootScope.currentAuthInfo = authInfo;

        if (authInfo.osspath) {
          $scope.ref.isBucketList = false;
          //bucketMap
          $rootScope.bucketMap = {};
          var bucket = ossSvs2.parseOSSPath(authInfo.osspath).bucket;
          $rootScope.bucketMap[bucket] = {
            region: authInfo.region,
          };

          $timeout(function () {
            addEvents();
            //$rootScope.$broadcast('ossAddressChange', authInfo.osspath);
            $scope.$broadcast("filesViewReady");
          });
        } else {
          $scope.ref.isBucketList = true;
          listBuckets(function () {
            addEvents();
            $scope.$broadcast("filesViewReady");
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
        $scope.$on("ossAddressChange", function (e, addr, forceRefresh) {
          console.log(
            "on:ossAddressChange:",
            addr,
            "forceRefresh:",
            forceRefresh
          );

          var info = ossSvs2.parseOSSPath(addr);

          if (info.key) {
            var lastGan = info.key.lastIndexOf("/");

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
              Toast.error("No permission");

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
              //fix ubuntu
              $timeout(function () {
                listFiles();
              }, 100);
            }
          } else {
            //list buckets
            $scope.currentBucket = null;
            $scope.ref.isBucketList = true;
            //只有从来没有 list buckets 过，才list，减少http请求开销
            if (!$scope.buckets || forceRefresh) listBuckets();

            clearObjectsList();
          }
        });
      }

      function goIn(bucket, prefix) {
        var ossPath = "oss://";

        if (bucket) {
          ossPath = "oss://" + bucket + "/" + (prefix || "");
        }
        $rootScope.$broadcast("goToOssAddress", ossPath);
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
        ossSvs2
          .listFiles(info.region, info.bucket, info.key, marker || "")
          .then(
            function (result) {
              const arr = result.data;
              settingsSvs.showImageSnapshot.get() == 1
                ? signPicURL(info, arr)
                : null;

              let oldFolderIndex = Math.max(
                0,
                $scope.objects.findIndex((i) => !i.isFolder)
              );
              let comingFolderIndex = Math.max(
                0,
                arr.findIndex((i) => !i.isFolder)
              );
              $scope.objects.splice(
                oldFolderIndex,
                0,
                ...arr.slice(0, comingFolderIndex)
              );
              $scope.objects = $scope.objects.concat(
                arr.slice(comingFolderIndex)
              );
              $scope.nextObjectsMarker = result.marker || null;

              safeApply($scope);
              if (fn) fn(null);
            },
            function (err) {
              console.log(err);
              clearObjectsList();

              if (fn) fn(err);
            }
          );
      }

      $scope.$watch(
        () => $scope.objects.length,
        () => {
          $scope.objectLengthI18nTip = T("search.files.num_msg", {
            num: $scope.objects.length,
          });
        }
      );

      let isLoadingObjectSymlinkMeta = false;
      let cacheSymlinkTooltipTpl = new Map();
      function loadObjectSymlinkMeta(item) {
        if (isLoadingObjectSymlinkMeta) return;
        cacheSymlinkTooltipTpl.delete(item);
        isLoadingObjectSymlinkMeta = true;
        const { region, bucket } = $scope.currentInfo;
        ossSvs2
          .loadObjectSymlinkMeta(region, bucket, item.Key)
          .then((result) => {
            item.targetName = result.targetName;
            cacheSymlinkTooltipTpl.set(
              item,
              $sce.trustAsHtml(`
              <div style="text-align: left;">
                ${T("file.message.symlink_help{target}!lines", {
                  target: result.targetName,
                })}
              </div>
              `)
            );
            safeApply($scope);
          })
          .finally(() => {
            $timeout(() => {
              isLoadingObjectSymlinkMeta = false;
            }, 500);
          });
      }

      function getSymlinkTooltipTpl(item) {
        return cacheSymlinkTooltipTpl.get(item) || "loading...";
      }

      function loadNext() {
        if ($scope.nextObjectsMarker) {
          console.log("loadNext");
          doListFiles($scope.currentInfo, $scope.nextObjectsMarker);
        }
      }

      function clearObjectsList() {
        initSelect();
        $scope.objects = [];
        $scope.nextObjectsMarker = null;
      }

      function signPicURL(info, result) {
        var authInfo = AuthInfo.get();
        if (authInfo.id.indexOf("STS.") == 0) {
          angular.forEach(result, function (n) {
            if (!n.isFolder && fileSvs.getFileType(n).type == "picture") {
              ossSvs2
                .getImageBase64Url(info.region, info.bucket, n.path)
                .then(function (data) {
                  if (data.ContentType.indexOf("image/") == 0) {
                    var base64str = new Buffer(data.Body).toString("base64");
                    n.pic_url =
                      "data:" + data.ContentType + ";base64," + base64str;
                  }
                });
            }
          });
        } else {
          angular.forEach(result, function (n) {
            if (!n.isFolder && fileSvs.getFileType(n).type == "picture") {
              n.pic_url = ossSvs2.signatureUrl2(
                info.region,
                info.bucket,
                n.path,
                3600,
                "image/resize,w_48"
              );
            }
          });
        }
        //return result;
      }

      function listBuckets(fn) {
        $scope.isLoading = true;
        ossSvs2.listAllBuckets().then(
          function (buckets) {
            $scope.isLoading = false;
            $scope.buckets = buckets;

            var m = {};
            angular.forEach(buckets, function (n) {
              m[n.name] = n;
            });
            $rootScope.bucketMap = m;

            safeApply($scope);

            if (fn) fn();
          },
          function (err) {
            console.log(err);
            $scope.isLoading = false;

            clearObjectsList();

            // $scope.buckets = [];
            // $rootScope.bucketMap = {};

            safeApply($scope);

            if (fn) fn();
          }
        );
      }

      function showDeleteBucket(item) {
        var title = T("bucket.delete.title");
        var message = T("bucket.delete.message", {
          name: item.name,
          region: item.region,
        });
        Dialog.confirm(
          title,
          message,
          function (b) {
            if (b) {
              ossSvs2.deleteBucket(item.region, item.name).then(function () {
                Toast.success(T("bucket.delete.success")); //删除Bucket成功
                //删除Bucket不是实时的，等待1秒后刷新
                $timeout(function () {
                  listBuckets();
                }, 1000);
              });
            }
          },
          1
        );
      }

      function showDeleteFilesSelected() {
        showDeleteFiles($scope.sel.has);
      }

      function showDeleteFiles(items) {
        $modal.open({
          templateUrl: "main/files/modals/delete-files-modal.html",
          controller: "deleteFilesModalCtrl",
          backdrop: "static",
          resolve: {
            items: function () {
              return items;
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
            callback: function () {
              return function () {
                $timeout(function () {
                  listFiles();
                }, 300);
              };
            },
          },
        });
      }

      function showAddBucket() {
        $modal.open({
          templateUrl: "main/files/modals/add-bucket-modal.html",
          controller: "addBucketModalCtrl",
          resolve: {
            item: function () {
              return null;
            },
            callback: function () {
              return function () {
                Toast.success(T("bucket.add.success")); //'创建Bucket成功'
                //创建Bucket不是实时的，等待1秒后刷新
                $timeout(function () {
                  listBuckets();
                }, 1000);
              };
            },
          },
        });
      }

      function showAddFolder() {
        $modal.open({
          templateUrl: "main/files/modals/add-folder-modal.html",
          controller: "addFolderModalCtrl",
          resolve: {
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
            callback: function () {
              return function () {
                Toast.success(T("folder.create.success")); //'创建目录成功'
                $timeout(function () {
                  listFiles();
                }, 300);
              };
            },
          },
        });
      }

      function showUpdateBucket(item) {
        $modal.open({
          templateUrl: "main/files/modals/update-bucket-modal.html",
          controller: "updateBucketModalCtrl",
          resolve: {
            item: function () {
              return item;
            },
            callback: function () {
              return function () {
                Toast.success(T("bucketACL.update.success")); //'修改Bucket权限成功'
                $timeout(function () {
                  listBuckets();
                }, 300);
              };
            },
          },
        });
      }

      function showBucketMultipart(item) {
        $modal.open({
          templateUrl: "main/files/modals/bucket-multipart-modal.html",
          controller: "bucketMultipartModalCtrl",
          size: "lg",
          backdrop: "static",
          resolve: {
            bucketInfo: function () {
              return item;
            },
          },
        });
      }

      function showPreview(item, type) {
        var fileType = fileSvs.getFileType(item);
        fileType.type = type || fileType.type;
        // console.log(fileType);

        //type: [picture|code|others|doc]

        var templateUrl = "main/files/modals/preview/others-modal.html";
        var controller = "othersModalCtrl";
        var backdrop = true;

        if (fileType.type == "code") {
          templateUrl = "main/files/modals/preview/code-modal.html";
          controller = "codeModalCtrl";
          backdrop = "static";
        } else if (fileType.type == "picture") {
          templateUrl = "main/files/modals/preview/picture-modal.html";
          controller = "pictureModalCtrl";
          //backdrop = 'static';
        } else if (fileType.type == "video") {
          templateUrl = "main/files/modals/preview/media-modal.html";
          controller = "mediaModalCtrl";
        } else if (fileType.type == "audio") {
          templateUrl = "main/files/modals/preview/media-modal.html";
          controller = "mediaModalCtrl";
        } else if (fileType.type == "doc") {
          templateUrl = "main/files/modals/preview/doc-modal.html";
          controller = "docModalCtrl";
        }

        $modal.open({
          templateUrl: templateUrl,
          controller: controller,
          size: "lg",
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
                callback: function (reloadStorageStatus) {
                  if (reloadStorageStatus) {
                    $timeout(function () {
                      //listFiles();
                      ossSvs2.loadStorageStatus(
                        $scope.currentInfo.region,
                        $scope.currentInfo.bucket,
                        [item]
                      );
                    }, 300);
                  }
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
                httpHeaders: function () {
                  showHttpHeaders(item);
                },
                crc: function () {
                  showCRC(item);
                },
              };
            },
          },
        });
      }

      function showCRC(item) {
        $modal.open({
          templateUrl: "main/files/modals/crc-modal.html",
          controller: "crcModalCtrl",
          resolve: {
            item: function () {
              return angular.copy(item);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
          },
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
          to = to.replace(/(\/*$)/g, "");

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
          $scope.sel.x["i_" + i] = f;
        }
      }

      var lastSeleteIndex = -1;

      function selectChanged(e, index) {
        //批量选中
        if (e && e.shiftKey) {
          var min = Math.min(lastSeleteIndex, index);
          var max = Math.max(lastSeleteIndex, index);
          for (var i = min; i <= max; i++) {
            $scope.sel.x["i_" + i] = true;
          }
        }

        var len = $scope.objects.length;
        var all = true;
        var has = false;
        for (var i = 0; i < len; i++) {
          if (!$scope.sel.x["i_" + i]) {
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

      function showUploadDialog(isFolder) {
        if (oudtid) return;
        oudtid = true;
        $timeout(function () {
          oudtid = false;
        }, 600);

        Dialog.showUploadDialog(function (filePaths) {
          if (!filePaths || filePaths.length == 0) return;
          $scope.handlers.uploadFilesHandler(filePaths, $scope.currentInfo);
        }, isFolder);
      }

      function showDownloadDialog() {
        if (oddtid) return;
        oddtid = true;
        $timeout(function () {
          oddtid = false;
        }, 600);

        Dialog.showDownloadDialog(function (folderPaths) {
          if (!folderPaths || folderPaths.length == 0 || !$scope.sel.has)
            return;

          var to = folderPaths[0];
          _downloadMulti(to);
        });
      }

      function _downloadMulti(to) {
        to = to.replace(/(\/*$)/g, "");

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
          templateUrl: "main/files/modals/grant-modal.html",
          controller: "grantModalCtrl",
          resolve: {
            items: function () {
              return items;
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
          },
        });
      }

      //生成授权码
      function showGrantToken(item) {
        $modal.open({
          templateUrl: "main/files/modals/grant-token-modal.html",
          controller: "grantTokenModalCtrl",
          resolve: {
            item: function () {
              return item;
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
          },
        });
      }

      //重命名
      function showRename(item) {
        $modal.open({
          templateUrl: "main/files/modals/rename-modal.html",
          controller: "renameModalCtrl",
          backdrop: "static",
          resolve: {
            item: function () {
              return angular.copy(item);
            },
            moveTo: function () {
              return angular.copy($scope.currentInfo);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
            isCopy: function () {
              return false;
            },
            callback: function () {
              return function () {
                $timeout(function () {
                  listFiles();
                }, 300);
              };
            },
          },
        });
      }

      function getCurrentOssPath() {
        return (
          "oss://" + $scope.currentInfo.bucket + "/" + $scope.currentInfo.key
        );
      }
      function cancelPaste() {
        $scope.keepMoveOptions = null;
        safeApply($scope);
      }
      function showPaste() {
        // if($scope.keepMoveOptions.originPath==getCurrentOssPath()){
        //   $scope.keepMoveOptions = null;
        //   return;
        // }
        var keyword = $scope.keepMoveOptions.isCopy ? T("copy") : T("move");
        var keepmove = $scope.keepMoveOptions.currentInfo;
        var current = $scope.currentInfo;

        if (
          $scope.keepMoveOptions.items.length == 1 &&
          $scope.currentInfo.bucket == $scope.keepMoveOptions.currentInfo.bucket
        ) {
          //1个支持重命名
          $modal.open({
            templateUrl: "main/files/modals/rename-modal.html",
            controller: "renameModalCtrl",
            backdrop: "static",
            resolve: {
              item: function () {
                return angular.copy($scope.keepMoveOptions.items[0]);
              },
              moveTo: function () {
                return angular.copy($scope.currentInfo);
              },
              currentInfo: function () {
                return angular.copy($scope.keepMoveOptions.currentInfo);
              },
              isCopy: function () {
                return $scope.keepMoveOptions.isCopy;
              },
              callback: function () {
                return function () {
                  $scope.keepMoveOptions = null;
                  $timeout(function () {
                    listFiles();
                  }, 100);
                };
              },
            },
          });
          return;
        }
        if (
          current.key === keepmove.key &&
          keyword === T("move") &&
          current.bucket === keepmove.bucket
        ) {
          Toast.warn(T("forbidden"));
        } else {
          var msg = T("paste.message1", {
            name: $scope.keepMoveOptions.items[0].name,
            action: keyword,
          });

          //  '将 <span class="text-info">'+
          //     + '等</span> ' + keyword+' 到这个目录下面（如有相同的文件或目录则覆盖）？';

          Dialog.confirm(keyword, msg, function (b) {
            if (b) {
              $modal.open({
                templateUrl: "main/files/modals/move-modal.html",
                controller: "moveModalCtrl",
                backdrop: "static",
                resolve: {
                  items: function () {
                    return angular.copy($scope.keepMoveOptions.items);
                  },
                  moveTo: function () {
                    return angular.copy($scope.currentInfo);
                  },
                  isCopy: function () {
                    return $scope.keepMoveOptions.isCopy;
                  },
                  renamePath: function () {
                    return "";
                  },
                  fromInfo: function () {
                    return angular.copy($scope.keepMoveOptions.currentInfo);
                  },
                  callback: function () {
                    return function () {
                      $scope.keepMoveOptions = null;
                      $timeout(function () {
                        listFiles();
                      }, 100);
                    };
                  },
                },
              });
            }
          });
        }
      }

      //移动
      function showMove(items, isCopy) {
        $scope.keepMoveOptions = {
          items: items,
          isCopy: isCopy,
          currentInfo: angular.copy($scope.currentInfo),
          originPath: getCurrentOssPath(),
        };
      }
      //地址
      function showAddress(item) {
        $modal.open({
          templateUrl: "main/files/modals/get-address.html",
          controller: "getAddressModalCtrl",
          resolve: {
            item: function () {
              return angular.copy(item);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
          },
        });
      }

      //acl
      function showACL(item) {
        $modal.open({
          templateUrl: "main/files/modals/update-acl-modal.html",
          controller: "updateACLModalCtrl",
          resolve: {
            item: function () {
              return angular.copy(item);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
          },
        });
      }

      function showHttpHeaders(item) {
        $modal.open({
          templateUrl: "main/files/modals/update-http-headers-modal.html",
          controller: "updateHttpHeadersModalCtrl",
          resolve: {
            item: function () {
              return angular.copy(Array.isArray(item) ? item : [item]);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
          },
        });
      }

      function showSymlink(item) {
        $modal.open({
          templateUrl: "main/files/modals/set-symlink-modal.html",
          controller: "setSymlinkModalCtrl",
          resolve: {
            item: function () {
              return angular.copy(item);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
            callback: function () {
              return function () {
                $timeout(function () {
                  listFiles();
                }, 300);
              };
            },
          },
        });
      }

      function showRestoreBatch() {
        let selectObjects = $scope.sel.has;
        let SelRestore = [];
        if (selectObjects && selectObjects.length > 0) {
          for (let i in selectObjects) {
            if (
              selectObjects[i].storageStatus !== 3 &&
              selectObjects[i].storageClass === "Archive"
            ) {
              SelRestore.push(selectObjects[i]);
            }
          }
          if (!SelRestore.length) {
            Toast.info(T("restore.msg"));
          } else {
            showSelrestores(SelRestore);
          }
        }
      }

      function showSelrestores(items) {
        $modal.open({
          templateUrl: "main/files/modals/batch-restore-modal.html",
          controller: "batchRestoreModalCtrl",
          resolve: {
            item: function () {
              return angular.copy(items);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
            callback: function () {
              return function () {
                $timeout(function () {
                  ossSvs2.loadStorageStatus(
                    $scope.currentInfo.region,
                    $scope.currentInfo.bucket,
                    items
                  );
                }, 300);
              };
            },
          },
        });
      }

      function showRestore(item) {
        $modal.open({
          templateUrl: "main/files/modals/restore-modal.html",
          controller: "restoreModalCtrl",
          resolve: {
            item: function () {
              return angular.copy(item);
            },
            currentInfo: function () {
              return angular.copy($scope.currentInfo);
            },
            callback: function () {
              return function () {
                $timeout(function () {
                  //listFiles();
                  ossSvs2.loadStorageStatus(
                    $scope.currentInfo.region,
                    $scope.currentInfo.bucket,
                    [item]
                  );
                }, 300);
              };
            },
          },
        });
      }

      function showUserList() {
        $modal.open({
          templateUrl: "main/modals/users.html",
          controller: "usersCtrl",
          size: "lg",
          backdrop: "static",
        });
      }
    },
  ]);

angular.module("web").controller("addBucketModalCtrl", [
  "$scope",
  "$uibModalInstance",
  "$translate",
  "callback",
  "ossSvs2",
  "Const",
  "Toast",
  "Dialog",
  function (
    $scope,
    $modalInstance,
    $translate,
    callback,
    ossSvs2,
    Const,
    Toast,
    Dialog
  ) {
    var T = $translate.instant;

    var bucketACL = angular.copy(Const.bucketACL);
    var regions = angular.copy(Const.regions);
    var storageClassesMap = {};
    angular.forEach(regions, function (n) {
      storageClassesMap[n.id] = n.storageClasses;
    });

    angular.extend($scope, {
      bucketACL: [], //angular.copy(Const.bucketACL),
      regions: [],
      cancel: cancel,
      onSubmit: onSubmit,
      storageClasses: [],
      item: {
        acl: bucketACL[0].acl,
        region: regions[0].id,
        storageClass: "Standard",
      },
      reg: /^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$/,
      onRegionChanged: onRegionChanged,
      onAclChanged: onAclChanged,
      openURL: function (v) {
        openExternal(v);
      },
    });

    i18nStorageClassesType();
    i18nBucketACL();
    i18nRegion();

    function i18nRegion() {
      var arr = angular.copy(Const.regions);
      //console.log(arr);
      angular.forEach(arr, function (n) {
        n.label = T("region." + n.id);
      });
      $scope.regions = arr;
    }

    function i18nBucketACL() {
      var arr = angular.copy(Const.bucketACL);
      angular.forEach(arr, function (n) {
        n.label = T("aclType." + n.acl);
      });
      $scope.bucketACL = arr;
    }

    function i18nStorageClassesType() {
      var arr = angular.copy(storageClassesMap[$scope.item.region]);
      angular.forEach(arr, function (n) {
        n.name = T("storageClassesType." + n.value.toLowerCase());
      });
      $scope.storageClasses = arr;
    }

    function onRegionChanged() {
      //console.log(storageClassesMap, $scope.item.region)
      i18nStorageClassesType();
      // if(['oss-cn-beijing','oss-cn-hangzhou'].indexOf($scope.item.region)==-1){
      //   $scope.storageClasses=[{value:'Standard',name:'标准类型'},{value:'IA',name:'低频访问类型'}];
      // }else{
      //   $scope.storageClasses=[{value:'Standard',name:'标准类型'},{value:'IA',name:'低频访问类型'},{value:'Archive',name:'归档类型'}];
      // }
      $scope.item.storageClass = "Standard";
    }

    function onAclChanged() {
      if ($scope.item.acl !== "private") {
        let message = T("acl.warn-not-private." + $scope.item.acl);
        Dialog.alert("", message);
      }
    }

    function cancel() {
      $modalInstance.dismiss("cancel");
    }

    function onSubmit(form) {
      if (!form.name.$valid) {
        Toast.error(T("bucket.add.name.invalid")); //'bucket名称无效'
        return;
      }
      if (!form.$valid) return;
      var item = angular.copy($scope.item);

      ossSvs2
        .createBucket(item.region, item.name, item.acl, item.storageClass)
        .then(function (result) {
          callback();
          cancel();
        });
    }
  },
]);

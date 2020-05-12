angular.module("web").controller("bucketMultipartModalCtrl", [
  "$scope",
  "$q",
  "$uibModalInstance",
  "$translate",
  "Dialog",
  "bucketInfo",
  "Toast",
  "ossSvs2",
  "safeApply",
  function (
    $scope,
    $q,
    $modalInstance,
    $translate,
    Dialog,
    bucketInfo,
    Toast,
    ossSvs2,
    safeApply
  ) {
    var T = $translate.instant;

    angular.extend($scope, {
      bucketInfo: bucketInfo,
      cancel: cancel,
      refresh: refresh,
      showDelete: showDelete,
      sch: {
        txt: "",
        limitTo: 20,
      },
      loadNext: loadNext,

      //全选相关
      sel: {
        all: false, //boolean
        has: false, //[] item: ossObject={name,path,...}
        x: {}, //{} {'i_'+$index, true|false}
      },
      selectAll: selectAll,
      selectChanged: selectChanged,
    });

    function loadNext() {
      $scope.sch.limitTo += 20;
    }

    refresh();

    function refresh() {
      initSelect();
      $scope.isLoading = true;
      listUploads(function () {
        $scope.isLoading = false;
      });
    }
    function listUploads(fn) {
      ossSvs2
        .listAllUploads(bucketInfo.region, bucketInfo.name)
        .then(function (result) {
          $scope.items = result;
          if (fn) fn();
        });
    }

    function cancel() {
      $modalInstance.dismiss("cancel");
    }

    function showDelete(items) {
      var title = T("delete.multiparts.title"); //删除碎片
      var message = T("delete.multiparts.message", { num: items.length }); //删除碎片
      Dialog.confirm(
        title,
        message,
        function (b) {
          if (b) {
            Toast.success(T("delete.multiparts.on")); //'正在删除碎片...'
            ossSvs2
              .abortAllUploads(bucketInfo.region, bucketInfo.name, items)
              .then(function () {
                Toast.success(T("delete.multiparts.success")); //'删除碎片成功'
                refresh();
              });
          }
        },
        1
      );
    }

    ////////////////////////////////
    function initSelect() {
      $scope.sel.all = false;
      $scope.sel.has = false;
      $scope.sel.x = {};
    }
    function selectAll() {
      var f = $scope.sel.all;
      $scope.sel.has = f ? $scope.items : false;
      var len = $scope.items.length;
      for (var i = 0; i < len; i++) {
        $scope.sel.x["i_" + i] = f;
      }
    }

    function selectChanged() {
      var len = $scope.items.length;
      var all = true;
      var has = false;
      for (var i = 0; i < len; i++) {
        if (!$scope.sel.x["i_" + i]) {
          all = false;
        } else {
          if (!has) has = [];
          has.push($scope.items[i]);
        }
      }
      $scope.sel.all = all;
      $scope.sel.has = has;
    }
    ////////////////////////////////
  },
]);

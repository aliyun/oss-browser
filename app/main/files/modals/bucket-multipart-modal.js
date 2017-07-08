angular.module('web')
  .controller('bucketMultipartModalCtrl', ['$scope','$q','$uibModalInstance','Dialog','bucketInfo','Toast','ossSvs2','safeApply',
    function ($scope, $q, $modalInstance, Dialog, bucketInfo,Toast, ossSvs2,safeApply) {

      angular.extend($scope, {
        bucketInfo: bucketInfo,
        cancel: cancel,
        refresh: refresh,
        showDelete: showDelete,
        sch: {
          txt: '',
          limitTo: 20
        },
        loadNext: loadNext,

        //全选相关
        sel: {
          all: false, //boolean
          has: false, //[] item: ossObject={name,path,...}
          x: {}       //{} {'i_'+$index, true|false}
        },
        selectAll: selectAll,
        selectChanged: selectChanged, 
      });

      function loadNext(){
        $scope.sch.limitTo+= 20;
      }


      refresh();

      function refresh(){
        initSelect();
        $scope.isLoading=true;
        listUploads(function(){
          $scope.isLoading=false;
        });
      }
      function listUploads(fn){
        ossSvs2.listAllUploads(bucketInfo.region, bucketInfo.name).then(function(result){
          $scope.items = result;
          if(fn) fn();
        });
      }

      function cancel(){
        $modalInstance.dismiss('cancel');
      }


      function showDelete(items){
        Dialog.confirm('删除碎片', '删除'+items.length+'个碎片, 确定删除吗？', function(b){
          if(b){
            Toast.success('正在删除碎片...');
            ossSvs2.abortAllUploads(bucketInfo.region, bucketInfo.name, items)
            .then(function(){
              Toast.success('删除碎片成功');
              refresh();
            });
          }
        },1);
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
          $scope.sel.x['i_' + i] = f;
        }
      }

      function selectChanged() {
        var len = $scope.items.length;
        var all = true;
        var has = false;
        for (var i = 0; i < len; i++) {
          if (!$scope.sel.x['i_' + i]) {
            all = false;
          }
          else {
            if (!has)has = [];
            has.push($scope.items[i]);
          }
        }
        $scope.sel.all = all;
        $scope.sel.has = has;
      }
      ////////////////////////////////

    }])
;

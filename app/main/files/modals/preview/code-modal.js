angular.module('web')
  .controller('codeModalCtrl', ['$scope','$uibModalInstance','bucketInfo','objectInfo','fileType','showFn','Toast','DiffModal','ossSvs',
    function ($scope, $modalInstance, bucketInfo, objectInfo, fileType, showFn, Toast,DiffModal, ossSvs) {

      angular.extend($scope, {
        bucketInfo: bucketInfo,
        objectInfo: objectInfo,
        fileType: fileType,

        showFn: showFn,

        cancel: cancel,
        getContent: getContent,
        saveContent: saveContent,
        //showDownload: showDownload,
        MAX_SIZE: 5 * 1024 * 1024
      });

      if(objectInfo.size < $scope.MAX_SIZE){
        getContent();
      }

      // function showDownload(){
      //   showFn.download(bucketInfo, objectInfo);
      //   cancel();
      // }

      function saveContent(){
        // Dialog.confirm('保存','确定保存？', function(b){
        //   if(b){
        //     var v = editor.getValue();
        //     $scope.content = v;
        //     ossSvs.saveContent(bucketInfo.region, bucketInfo.bucket, objectInfo.path, v).then(function(result){
        //       Toast.success('保存成功');
        //       cancel();
        //     });
        //   }
        // });


        var originalContent = $scope.originalContent;
        var v = editor.getValue();
        $scope.content = v;

        if(originalContent != v){
          DiffModal.show('Diff', originalContent, v, function(v) {
            Toast.info('正在保存...');

            ossSvs.saveContent(bucketInfo.region, bucketInfo.bucket, objectInfo.path, v).then(function(result){
              Toast.success('保存成功');
              cancel();
            });
          });
        }
        else{
          Toast.info('内容没有被修改');
        }
      }


      function getContent(){
        ossSvs.getContent(bucketInfo.region, bucketInfo.bucket, objectInfo.path).then(function(result){
          var data = result.content.toString();
          $scope.originalContent = data;
          $scope.content = data;
          editor.setValue(data);
        });
      }

      function cancel() {
        $modalInstance.dismiss('close');
      }

      $scope.codeOptions = {
        lineNumbers: true,
        lineWrapping: true,
        autoFocus: true,
        readOnly: false,
        mode: fileType.mode
      };

      var editor;
      $scope.codemirrorLoaded  = function(_editor){
        editor = _editor;
        // Editor part
        var _doc = _editor.getDoc();
        _editor.focus();

        // Options
        _editor.setSize('100%', 500);

        _editor.refresh();

        _doc.markClean();
      };


    }])
;

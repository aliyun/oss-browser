angular.module('web')
  .controller('getAddressModalCtrl', ['$scope', '$q', '$uibModalInstance', 'item', 'currentInfo', 'ossSvs','safeApply',
    function ($scope, $q, $modalInstance, item, currentInfo, ossSvs ,safeApply) {


      angular.extend($scope, {
        item: item,
        currentInfo: currentInfo,
        info: {
          sec: 3600,
          url: null
        },
        cancel: cancel,
        onSubmit: onSubmit
      });

      function cancel() {
        $modalInstance.dismiss('close');
      }

      init();
      function init(){
        $scope.isLoading = true;
        $scope.step=2;
        var ignoreError = true;

        $.ajax({url: item.url,
          headers: {'Range':'bytes=0-1','x-random':Math.random()},
          complete: function(xhr){
            $scope.isLoading = false;
            if(xhr.status < 300){
              $scope.err = null;
              $scope.step=1;
            }
            else if(xhr.status==403){
              $scope.step = 2;
            }
            else{
              $scope.step = 3;
            }
            safeApply($scope);
          }
        });

      }

      function onSubmit(form1){
        if(!form1.$valid)return;

        var v = $scope.info.sec;
        var url = ossSvs.signatureUrl(currentInfo.region, currentInfo.bucket, item.path, v);
        $scope.info.url = url;
      }

    }
  ]);

angular.module('web')
  .controller('getAddressModalCtrl', ['$scope', '$q','$translate', '$uibModalInstance', 'item', 'currentInfo', 'ossSvs2','safeApply','Const','Mailer','Toast',
    function ($scope, $q, $translate, $modalInstance, item, currentInfo, ossSvs2 ,safeApply, Const,Mailer,Toast) {
      var T = $translate.instant;

      angular.extend($scope, {
        item: item,
        reg: {
          email: Const.REG.EMAIL,
        },
        currentInfo: currentInfo,
        info: {
          sec: 3600,
          url: null,
          mailTo: ''
        },
        cancel: cancel,
        onSubmit: onSubmit,
        sendTo: sendTo
      });

      function cancel() {
        $modalInstance.dismiss('close');
      }

      init();
      function init(){
        $scope.isLoading = true;
        $scope.step = 2;
        var ignoreError = true;

        ossSvs2.getACL(currentInfo.region, currentInfo.bucket,item.path).then(function(res){
          $scope.isLoading = false;
          if (res.acl == 'public-read' || res.acl == 'public-read-write') {
            $scope.err = null;
            $scope.info.url = $scope.item.url;
            $scope.step = 1;
            safeApply($scope);
          } else {
            ossSvs2.getBucketACL(currentInfo.region, currentInfo.bucket).then(function(result){
              $scope.isLoading = false;
              if (res.acl == 'public-read' || res.acl == 'public-read-write') {
                $scope.err = null;
                $scope.info.url = $scope.item.url;
                $scope.step = 1;
              } else {
                $scope.err = null;
                $scope.step = 2;
              }
              safeApply($scope);
            }, function(error) {
              $scope.err = error;
              $scope.step = 3;
              safeApply($scope);
            });
          }
        }, function(error) {
          $scope.isLoading = false;
          $scope.err = error;
          $scope.step = 3;
          safeApply($scope);
        });
      }

      function onSubmit(form1){
        if(!form1.$valid)return;

        var v = $scope.info.sec;
        var url = ossSvs2.signatureUrl2(currentInfo.region, currentInfo.bucket, item.path, v);
        $scope.info.url = url;
      }

      function sendTo(form1){
        var url = $scope.info.url;

        if(!form1.email.$valid || !url)return;

        var t=[ ];
        var name = $scope.item.name;

        t.push(T('click.download')+': <a href="'+url+'" target="_blank">'+name+'</a>'); //点此下载

        t.push(T('qrcode.download')+':') //扫码下载

        var src = $('#addr-qrcode-wrap canvas')[0].toDataURL("image/jpeg");
        t.push('<img src="'+src+'" style="width:300px;height:300px"/>');


        var sendInfo = {
          subject: T('file.download.address')+':['+ name+']',
          to: $scope.info.mailTo,
          html: t.join('<br/>')
        };
        //console.log(sendInfo)

        //发邮件
        Toast.info(T('mail.send.on'));
        Mailer.send(sendInfo).then(function(result){
          console.log(result)
          Toast.success(T('mail.test.success'));
        },function(err){
          console.error(err);
          Toast.error(err);
        });

      }

    }
  ]);

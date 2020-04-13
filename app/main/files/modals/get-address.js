angular.module('web')
  .controller('getAddressModalCtrl', ['$scope', '$q', '$translate', '$uibModalInstance', 'item', 'currentInfo', 'ossSvs2', 'safeApply', 'Const', 'Mailer', 'Toast',
    function ($scope, $q, $translate, $modalInstance, item, currentInfo, ossSvs2, safeApply, Const, Mailer, Toast) {
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

      function init() {
        $scope.isLoading = true;
        $scope.step = 2;
        var ignoreError = true;

        const url = ossSvs2.signatureUrl2(currentInfo.region, currentInfo.bucket, item.path, $scope.info.sec);
        $.ajax({
          url: url,
          headers: {
            'Range': 'bytes=0-1',
            'x-random': Math.random(),
            'Cache-Control': "no-cache"
          },
          complete: function (xhr) {
            $scope.isLoading = false;
            $scope.err = null;
            if (xhr.status >= 200 && xhr.status <= 300) {
              $scope.info.url = $scope.item.url;
              $scope.step = 1;
            } else if (xhr.status == 403) {
              $scope.step = 2;
            } else {
              $scope.err = xhr.responseText;
              $scope.step = 3;
            }
            safeApply($scope);
          }
        });

      }

      function onSubmit(form1) {
        if (!form1.$valid) return;

        var v = $scope.info.sec;
        var url = ossSvs2.signatureUrl2(currentInfo.region, currentInfo.bucket, item.path, v);

        $scope.isLoading = true;
        $.ajax({
          url: url,
          headers: {
            'Range': 'bytes=0-1',
            'x-random': Math.random(),
            'Cache-Control': "no-cache"
          },
          complete: function (xhr) {
            $scope.isLoading = false;
            if (xhr.status >= 200 && xhr.status <= 300) {
              $scope.err = null;
              $scope.info.url = url;
            } else {
              $scope.err = xhr.responseText;
              $scope.step = 3;
            }
            safeApply($scope);
          }
        });
        safeApply($scope);
      }

      function sendTo(form1) {
        var url = $scope.info.url;

        if (!form1.email.$valid || !url) return;

        var t = [];
        var name = $scope.item.name;

        t.push(T('click.download') + ': <a href="' + url + '" target="_blank">' + name + '</a>'); //点此下载

        t.push(T('qrcode.download') + ':') //扫码下载

        var src = $('#addr-qrcode-wrap canvas')[0].toDataURL("image/jpeg");
        t.push('<img src="' + src + '" style="width:300px;height:300px"/>');

        var sendInfo = {
          subject: T('file.download.address') + ':[' + name + ']',
          to: $scope.info.mailTo,
          html: t.join('<br/>')
        };
        //console.log(sendInfo)

        //发邮件
        Toast.info(T('mail.send.on'));
        Mailer.send(sendInfo).then(function (result) {
          console.log(result)
          Toast.success(T('mail.test.success'));
        }, function (err) {
          console.error(err);
          Toast.error(err);
        });

      }

    }
  ]);

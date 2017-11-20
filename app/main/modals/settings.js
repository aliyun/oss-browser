'use strict';

angular.module('web')
  .controller('settingsCtrl', ['$scope','$state','$timeout','$uibModalInstance','$translate','callback','settingsSvs','Mailer','Toast','Dialog','Const',
  function($scope,$state,$timeout, $modalInstance,$translate, callback,settingsSvs,Mailer,Toast,Dialog,Const){
    var T = $translate.instant;
    angular.extend($scope, {
      showTab: 3,
      set: {
        maxUploadJobCount: settingsSvs.maxUploadJobCount.get(),
        maxDownloadJobCount: settingsSvs.maxDownloadJobCount.get(),
        showImageSnapshot: settingsSvs.showImageSnapshot.get(),
        historiesLength : settingsSvs.historiesLength.get(),
        mailSmtp : settingsSvs.mailSmtp.get(),
        enableCrc64: settingsSvs.enableCrc64.get(),
      },
      reg: {
        email: Const.REG.EMAIL
      },
      setChange: setChange,
      cancel: cancel,

      testMail: testMail
    });

    var tid;
    function setChange(form1, key, ttl){
      $timeout.cancel(tid);
      tid=$timeout(function(){
        if(!form1.$valid)return;
        settingsSvs[key].set( $scope.set[key] );
        Toast.success(T('settings.success')); //已经保存设置

      },ttl||100);

    }

    function cancel(){
      if(callback)callback();
      $modalInstance.dismiss('close');
    }

    function testMail(){
      var title = T('mail.test.title'); //测试邮件
      var message = T('mail.test.message', {from: $scope.set.mailSmtp.from}); //将发送测试邮件到
      Dialog.confirm(title, message, function(b){
        if(!b)return;
        Toast.info(T('mail.send.on'))
        Mailer.send({
          subject: 'OSS Browser Test',
          to: $scope.set.mailSmtp.from,
          html: 'test'
        }).then(function(result){
          console.log(result)
          Toast.success(T('mail.test.success')); // 邮件发送成功');
        },function(err){
          console.error(err);
          Toast.error(err);
        });
      });
    }

  }])
;

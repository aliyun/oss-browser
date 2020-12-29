angular.module("web").controller("getAddressModalCtrl", [
  "$scope",
  "$rootScope",
  "$q",
  "$translate",
  "$uibModalInstance",
  "item",
  "currentInfo",
  "ossSvs2",
  "safeApply",
  "Const",
  "Mailer",
  "Toast",
  "$timeout",
  function (
    $scope,
    $rootScope,
    $q,
    $translate,
    $modalInstance,
    item,
    currentInfo,
    ossSvs2,
    safeApply,
    Const,
    Mailer,
    Toast,
    $timeout
  ) {
    var T = $translate.instant;

    const LastSelectedDomainCtor = {
      key: "_lastSelectedDomain",
      get() {
        return window.localStorage.getItem(LastSelectedDomainCtor.key);
      },
      set(v) {
        window.localStorage.setItem(LastSelectedDomainCtor.key, v);
      },
    };

    angular.extend($scope, {
      item: item,
      reg: {
        email: Const.REG.EMAIL,
      },
      currentInfo: currentInfo,
      info: {
        sec: 3600,
        url: null,
        originUrl: null,
        custom_domain: undefined,
        mailTo: "",
      },
      customDomainList: [],
      onCustomDomainChange: onCustomDomainChange,
      cancel: cancel,
      onSubmit: onSubmit,
      sendTo: sendTo,
    });

    function cancel() {
      $modalInstance.dismiss("close");
    }

    init();

    function init() {
      $scope.isLoading = true;

      $.ajax({
        url: item.url,
        headers: {
          Range: "bytes=0-1",
          "x-random": Math.random(),
          "Cache-Control": "no-cache",
        },
        complete: function (xhr) {
          $scope.err = null;
          if (xhr.status >= 200 && xhr.status <= 300) {
            $scope.info.originUrl = $scope.item.url;
            $scope.step = 1;
          } else if (xhr.status == 403) {
            $scope.step = 2;
          } else {
            $scope.err = xhr.responseText;
            $scope.step = 3;
          }

          // 如果不是Cname方式登录的，获取自有域名列表
          if (!$rootScope.currentAuthInfo.cname) {
            ossSvs2
              .listAllCustomDomains(currentInfo.bucket)
              .then((domainList) => {
                if (domainList && domainList.length) {
                  $scope.customDomainList = [
                    {
                      label: T("not_use_own_domain"), // 不使用自有域名
                      value: undefined,
                    },
                  ].concat(
                    domainList.map((domain) => ({
                      label: domain,
                      value: domain,
                    }))
                  );
                  const last = LastSelectedDomainCtor.get();
                  if (domainList.includes(last)) {
                    $scope.info.custom_domain = last;
                    coerceRefDisplayUrl();
                  }
                }
                $scope.isLoading = false;
                safeApply($scope);
              })
              .catch((e) => {
                console.log(e);
                $scope.isLoading = false;
                safeApply($scope);
              });
          } else {
            $scope.isLoading = false;
            safeApply($scope);
          }
        },
      });
    }

    function onSubmit(form1) {
      if (!form1.$valid) return;

      var v = $scope.info.sec;

      var url = ossSvs2.signatureUrl2(
        currentInfo.region,
        currentInfo.bucket,
        item.path,
        v
      );

      $scope.isLoading = true;
      $.ajax({
        url: url,
        headers: {
          Range: "bytes=0-1",
          "x-random": Math.random(),
          "Cache-Control": "no-cache",
        },
        complete: function (xhr) {
          $scope.isLoading = false;
          if (xhr.status >= 200 && xhr.status <= 300) {
            $scope.err = null;
            $scope.info.originUrl = url;
          } else {
            $scope.err = xhr.responseText;
            $scope.step = 3;
          }
          safeApply($scope);
        },
      });
      safeApply($scope);
    }

    $scope.$watch("info.originUrl", coerceRefDisplayUrl);

    function onCustomDomainChange(v) {
      LastSelectedDomainCtor.set(v);
      coerceRefDisplayUrl();
    }

    function coerceRefDisplayUrl() {
      $timeout(() => {
        const { originUrl, custom_domain } = $scope.info;
        // 初始化时 originUrl 为 null，确保其值合法
        if (!originUrl || typeof originUrl !== "string") {
          return;
        }
        const newUrlWithCustomDomain = custom_domain
          ? originUrl.replace(/\/\/[^/]+\//, `//${custom_domain}/`)
          : originUrl;
        $scope.item.url = newUrlWithCustomDomain;
        $scope.info.url = newUrlWithCustomDomain;
      }, 1);
    }

    function sendTo(form1) {
      var url = $scope.info.url;

      if (!form1.email.$valid || !url) return;

      var t = [];
      var name = $scope.item.name;

      t.push(
        T("click.download") +
          ': <a href="' +
          url +
          '" target="_blank">' +
          name +
          "</a>"
      ); //点此下载

      t.push(T("qrcode.download") + ":"); //扫码下载

      var src = $("#addr-qrcode-wrap canvas")[0].toDataURL("image/jpeg");
      t.push('<img src="' + src + '" style="width:300px;height:300px"/>');

      var sendInfo = {
        subject: T("file.download.address") + ":[" + name + "]",
        to: $scope.info.mailTo,
        html: t.join("<br/>"),
      };
      //console.log(sendInfo)

      //发邮件
      Toast.info(T("mail.send.on"));
      Mailer.send(sendInfo).then(
        function (result) {
          console.log(result);
          Toast.success(T("mail.test.success"));
        },
        function (err) {
          console.error(err);
          Toast.error(err);
        }
      );
    }
  },
]);

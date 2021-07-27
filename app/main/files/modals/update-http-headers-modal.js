angular.module('web').controller('updateHttpHeadersModalCtrl', [
  '$scope',
  '$q',
  '$translate',
  '$uibModalInstance',
  'item',
  'currentInfo',
  'ossSvs2',
  'Toast',
  'safeApply',
  function(
      $scope,
      $q,
      $translate,
      $modalInstance,
      item,
      currentInfo,
      ossSvs2,
      Toast,
      safeApply
  ) {
    var T = $translate.instant;

    angular.extend($scope, {
      item: item,
      currentInfo: currentInfo,
      // metas: {},
      headers: {},
      metaItems: [],
      cancel: cancel,
      onSubmit: onSubmit
    });

    function cancel() {
      $modalInstance.dismiss('close');
    }

    init();

    function init() {
      $scope.isLoading = true;
      $scope.step = 2;

      if (item.length > 1) { return; }

      ossSvs2
          .getMeta(currentInfo.region, currentInfo.bucket, item[0].path)
          .then(function(result) {
            $scope.headers = {
              ContentLanguage: result.ContentLanguage,
              ContentType: result.ContentType,
              CacheControl: result.CacheControl,
              ContentDisposition: result.ContentDisposition,
              ContentEncoding: result.ContentEncoding,
              Expires: result.Expires
            };
            // $scope.metas = result.Metadata;

            var t = [];

            for (var k in result.Metadata) {
              t.push({ key: k, value: result.Metadata[k] });
            }

            $scope.metaItems = t;

            safeApply($scope);
          });
    }

    function onSubmit(form1) {
      if (!form1.$valid) { return; }

      var headers = angular.copy($scope.headers);
      var metaItems = angular.copy($scope.metaItems);

      // 将ContentType转化为Content-Type
      const HeadersMap = {
        ContentLanguage: 'Content-Language',
        ContentType: 'Content-Type',
        CacheControl: 'Cache-Control',
        ContentDisposition: 'Content-Disposition',
        ContentEncoding: 'Content-Encoding',
        Expires: 'Expires'
      };

      for (var k in headers) {
        if (headers[k]) {
          headers[HeadersMap[k]] = headers[k];
        }

        delete headers[k];
      }

      var metas = {};

      angular.forEach(metaItems, function(n) {
        if (n.key && n.value) { metas[n.key] = n.value; }
      });
      // console.log(headers, metas)
      Toast.info(T('setting.on')); // '正在设置..'
      Promise.all(item.map((i) =>
        ossSvs2.setMeta2(
            currentInfo.region,
            currentInfo.bucket,
            i.path,
            headers,
            metas
        ))).then(() => {
        Toast.success(T('setting.success')); // '设置成功'
      });
      cancel();
    }
  }
]);

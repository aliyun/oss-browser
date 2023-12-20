angular.module("web").controller("grantModalCtrlCode", [
  "$translate",
  "$scope",
  "$sce",
  "$uibModalInstance",
  "Toast",
  "info",
  function ($translate, $scope, $sce, $modalInstance, Toast, info) {
    var T = $translate.instant;

    const { html } = info;
    const regx = /<code.*>(.*)<\/code>/gi;
    let ihtml = "";
    const res = regx.exec(html);
    if (res.length > 1) ihtml = `${T("auth.tokenLogin")}:<br/><br/>${res[0]}`;

    angular.extend($scope, {
      cancel: cancel,
      copy: copy,
      htm: $sce.trustAsHtml(ihtml),
    });

    function cancel() {
      $modalInstance.dismiss("close");
    }

    function copy() {
      const { clipboard } = require("electron");
      if (res.length > 1) {
        clipboard.writeText(res[1]);
        Toast.success(T("copy.successfully"));
      }
    }
  },
]);

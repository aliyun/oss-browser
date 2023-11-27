angular.module("web").controller("grantModalCtrlCode", [
  "$translate",
  "$scope",
  "$sce",
  "$uibModalInstance",
  "info",
  function ($translate, $scope, $sce, $modalInstance, info) {
    var T = $translate.instant;

    const { html } = info;
    const regx = /<code.*>.*<\/code>/gi;
    let ihtml = "";
    const res = html.match(regx);
    if (res.length > 0) ihtml = `${T("auth.tokenLogin")}:<br/><br/>${res[0]}`;

    angular.extend($scope, {
      cancel: cancel,
      htm: $sce.trustAsHtml(ihtml),
    });

    function cancel() {
      $modalInstance.dismiss("close");
    }
  },
]);

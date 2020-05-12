"use strict";

angular.module("web").controller("aboutCtrl", [
  "$scope",
  "$state",
  "$uibModalInstance",
  "$interval",
  "autoUpgradeSvs",
  "safeApply",
  "Toast",
  "pscope",
  function (
    $scope,
    $state,
    $modalInstance,
    $interval,
    autoUpgradeSvs,
    safeApply,
    Toast,
    pscope
  ) {
    angular.extend($scope, {
      cancel: cancel,
      startUpgrade: startUpgrade,
      installAndRestart: installAndRestart,
      open: open,
      app_logo: Global.app.logo,
      info: {
        currentVersion: Global.app.version,
      },
      custom_about_html: Global.about_html,
    });

    $interval(function () {
      Object.assign($scope.info, pscope.upgradeInfo);
    }, 1000);

    function installAndRestart() {
      gInstallAndRestart($scope.info.lastVersion);
    }

    init();
    function init() {
      $scope.info = pscope.upgradeInfo;

      if (!$scope.info.isLastVersion) {
        var converter = new showdown.Converter();
        autoUpgradeSvs.getLastestReleaseNote(
          $scope.info.lastVersion,
          $scope.langSettings.lang,
          function (text) {
            text = text + "";
            var html = converter.makeHtml(text);
            $scope.info.lastReleaseNote = html;
            //safeApply($scope);
          }
        );
      }
    }

    function startUpgrade() {
      autoUpgradeSvs.start();
    }

    function open(a) {
      openExternal(a);
    }

    function cancel() {
      $modalInstance.dismiss("close");
    }
  },
]);

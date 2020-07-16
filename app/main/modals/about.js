"use strict";

angular.module("web").controller("aboutCtrl", [
  "$scope",
  "$state",
  "$uibModalInstance",
  "$interval",
  "autoUpgradeSvs",
  "safeApply",
  "Toast",
  "updateSvs",
  "pscope",
  function (
    $scope,
    $state,
    $modalInstance,
    $interval,
    autoUpgradeSvs,
    safeApply,
    Toast,
    updateSvs,
    pscope
  ) {
    angular.extend($scope, {
      cancel: cancel,
      startUpgrade: startUpgrade,
      installAndRestart: installAndRestart,
      open: open,
      app_logo: "icons/icon.png",
      info: {
        currentVersion: null,
        isLastVersion: true,
        lastVersion: null,
        lastReleaseNote: null,
        status: null,
        files: null,
        link: null,
        total: null,
        current: null,
        errorMsg: null,
      },
      custom_about_html: null,
    });

    $interval(function () {
      Object.assign($scope.info, pscope.upgradeInfo);
      if ($scope.info.current && $scope.info.total) {
        $scope.info.progress = Math.ceil(
          ($scope.info.current / $scope.info.total) * 100
        );
      }
    }, 1000);

    function installAndRestart() {
      updateSvs.quitAndInstall();
    }

    init();
    function init() {
      $scope.info = pscope.upgradeInfo;

      if (!$scope.info.isLastVersion) {
        var converter = new showdown.Converter();
        $scope.info.lastReleaseNote = converter.makeHtml(
          $scope.info.lastReleaseNote
        );
      }
    }

    function startUpgrade() {
      updateSvs.startDownload();
    }

    function open(a) {
      openExternal(a);
    }

    function cancel() {
      $modalInstance.dismiss("close");
    }
  },
]);

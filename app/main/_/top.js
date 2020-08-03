angular.module("web").controller("topCtrl", [
  "$scope",
  "$rootScope",
  "$uibModal",
  "$location",
  "$translate",
  "$timeout",
  "Dialog",
  "Auth",
  "Const",
  "AuthInfo",
  "settingsSvs",
  "autoUpgradeSvs",
  "updateSvs",
  "safeApply",
  function (
    $scope,
    $rootScope,
    $modal,
    $location,
    $translate,
    $timeout,
    Dialog,
    Auth,
    Const,
    AuthInfo,
    settingsSvs,
    autoUpgradeSvs,
    updateSvs,
    safeApply
  ) {
    var fs = require("fs");
    var path = require("path");
    const { app } = require("electron").remote;
    var T = $translate.instant;

    angular.extend($scope, {
      logout: logout,
      showFavList: showFavList,
      showAbout: showAbout,
      showReleaseNote: showReleaseNote,
      click10: click10,
      app: {
        logo: "icons/icon.png",
        version: app.getVersion(),
      },
      upgradeInfo: {
        currentVersion: app.getVersion(),
        isLastVersion: true,
        lastVersion: null,
        lastReleaseNote: null,
        status: null,
        total: null,
        current: null,
        errorMsg: null,
      },
    });

    var ctime = 0;
    var tid;
    function click10() {
      ctime++;
      if (ctime > 10) {
        console.log("---open dev tool---");
        openDevTools();
      }
      $timeout.cancel(tid);
      tid = $timeout(function () {
        ctime = 0;
      }, 600);
    }

    //$scope.aid = AuthInfo.get().id;
    $scope.authInfo = AuthInfo.get();
    $scope.authInfo.expirationStr = moment(
      new Date($scope.authInfo.expiration)
    ).format("YYYY-MM-DD HH:mm:ss");

    $timeout(function () {
      updateSvs.checkForUpdate((info) => {
        angular.extend($scope.upgradeInfo, info);
        safeApply($scope);
        if (info.status === "failed") {
          console.log("Update failed" + info.errorMsg, info);
        }
        if (info.status === "finished") {
          $scope.showAbout();
        }
      });
    }, 2000);

    $rootScope.showSettings = function (fn) {
      $modal.open({
        templateUrl: "main/modals/settings.html",
        controller: "settingsCtrl",
        resolve: {
          callback: function () {
            return fn;
          },
        },
      });
    };

    function logout() {
      var title = T("logout");
      var message = T("logout.message");
      Dialog.confirm(
        title,
        message,
        function (b) {
          if (b) {
            Auth.logout().then(function () {
              $location.url("/login");
            });
          }
        },
        1
      );
    }

    function showReleaseNote() {
      var converter = new showdown.Converter();

      const currentVersion = $scope.upgradeInfo.currentVersion;
      var url =
        autoUpgradeSvs.compareVersion(currentVersion, "1.5.1") <= 0
          ? path.join(__dirname, "release-notes", currentVersion + ".md")
          : path.join(
              __dirname,
              "release-notes",
              currentVersion + "." + $scope.langSettings.lang + ".md"
            );

      fs.readFile(url, function (err, text) {
        if (err) {
          console.error(err);
          return;
        }
        text = text + "";
        var html = converter.makeHtml(text);
        var message = T("main.upgration"); //'主要更新'
        Dialog.alert(message, html, function () {}, { size: "lg" });
      });
    }

    function showFavList() {
      $modal.open({
        templateUrl: "main/modals/fav-list.html",
        controller: "favListCtrl",
        size: "lg",
      });
    }

    function showAbout() {
      $modal.open({
        templateUrl: "main/modals/about.html",
        controller: "aboutCtrl",
        size: "md",
        resolve: {
          pscope: function () {
            return $scope;
          },
        },
      });
    }
  },
]);

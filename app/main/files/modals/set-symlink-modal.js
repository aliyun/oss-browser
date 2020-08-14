angular.module("web").controller("setSymlinkModalCtrl", [
  "$scope",
  "$uibModalInstance",
  "$translate",
  "ossSvs2",
  "item",
  "currentInfo",
  "callback",
  "Toast",
  function (
    $scope,
    $modalInstance,
    $translate,
    ossSvs2,
    item,
    currentInfo,
    callback,
    Toast
  ) {
    var intl = $translate.instant;
    angular.extend($scope, {
      currentInfo: currentInfo,
      item: item,
      targetName: "",
      cancel: cancel,
      onSubmit: onSubmit,
    });

    function validator(value) {
      const emojiRegex = require("emoji-regex");
      const REG_EMOJI = emojiRegex();
      const REG_2DOTS = /^\.\.$|\/\.\.\/?$|\/\.\.\//; // 「..」「../」「prefix/..」「prefix/../」「prefix/../suffix」
      const REG_LEADING_SLASH = /^(\/|\\)/;
      const REG_END_SLASH = /(\/|\\)$/;
      const REG_CONTINUOUS_SLASH = /\/\//;
      return new Promise((resolve, reject) => {
        if (REG_EMOJI.test(value)) {
          reject(intl("file.md.name.error.emoji"));
        }

        if (REG_2DOTS.test(value)) {
          reject(intl("file.md.name.error.2dots"));
        }

        if (REG_CONTINUOUS_SLASH.test(value)) {
          reject(intl("file.md.name.error.continuous slash"));
        }

        if (REG_LEADING_SLASH.test(value)) {
          reject(intl("file.message.validation_end_slash!html"));
        }

        if (REG_END_SLASH.test(value)) {
          reject(intl("file.message.validation_end_slash!html"));
        }

        resolve(value);
      });
    }

    function cancel() {
      $modalInstance.dismiss("close");
    }

    function onSubmit() {
      validator($scope.targetName)
        .then(() => {
          const { region, bucket } = $scope.currentInfo;
          ossSvs2
            .putObjectSymlinkMeta(region, bucket, $scope.targetName, item.path)
            .then(() => {
              if (
                (item.path.lastIndexOf("/") === -1 &&
                  $scope.targetName.lastIndexOf("/") === -1) ||
                item.path.slice(0, item.path.lastIndexOf("/")) ===
                  $scope.targetName.slice(0, item.path.lastIndexOf("/"))
              ) {
                callback();
              }
              Toast.success($translate.instant("setup.success"));
              cancel();
            });
        })
        .catch((err) => {
          Toast.error(err);
        });
    }
  },
]);

"use strict";

angular.module("web").controller("userAKCtrl", [
  "$scope",
  "$rootScope",
  "$translate",
  "$state",
  "$uibModalInstance",
  "user",
  "ramSvs",
  "subUserAKSvs",
  "Toast",
  "Dialog",
  "Const",
  function (
    $scope,
    $rootScope,
    $translate,
    $state,
    $modalInstance,
    user,
    ramSvs,
    subUserAKSvs,
    Toast,
    Dialog,
    Const
  ) {
    var T = $translate.instant;

    angular.extend($scope, {
      user: user || {},
      items: [],
      isLoading: false,
      cancel: cancel,
      refresh: refresh,
      updateStatus: updateStatus,
      showRemove: showRemove,
      showAdd: showAdd,
    });
    refresh();

    function refresh() {
      $scope.isLoading = true;
      subUserAKSvs.list().then(function (arr) {
        var akMap = {};
        angular.forEach(arr, function (n) {
          akMap[n.AccessKeyId] = n.AccessKeySecret;
        });

        ramSvs.listAccessKeys(user.UserName).then(
          function (result) {
            $scope.isLoading = false;
            var items = result.AccessKeys.AccessKey;
            angular.forEach(items, function (n) {
              n.AccessKeySecret = akMap[n.AccessKeyId] || "";
            });
            items.sort(function (a, b) {
              return a.UpdateDate < b.UpdateDate ? 1 : -1;
            });
            $scope.items = items;
          },
          function () {
            $scope.isLoading = false;
          }
        );
      });
    }

    function showRemove(item) {
      Dialog.confirm(title, message, function (b) {
        if (!b) return;
        ramSvs
          .deleteAccessKey(user.UserName, item.AccessKeyId)
          .then(function () {
            refresh();
          });
      });
    }

    function updateStatus(item) {
      var title = T("ak.status.update.title." + item.Status);
      var message = T("ak.status.update.message." + item.Status);

      var status = item.Status == "Active" ? "Inactive" : "Active";

      Dialog.confirm(
        title,
        message,
        function (b) {
          if (!b) return;
          ramSvs
            .updateAccessKey(user.UserName, item.AccessKeyId, status)
            .then(function () {
              refresh();
            });
        },
        item.Status == "Active" ? 1 : 0
      );
    }

    function showRemove(item) {
      var title = T("ak.delete.title");
      var message = T("ak.delete.message");

      Dialog.confirm(
        title,
        message,
        function (b) {
          if (!b) return;
          ramSvs
            .deleteAccessKey(user.UserName, item.AccessKeyId)
            .then(function () {
              refresh();
            });
        },
        1
      );
    }

    function showAdd() {
      ramSvs.createAccessKey(user.UserName).then(function (result) {
        //result.AccessKey.AccessKeyId,
        subUserAKSvs
          .save({
            AccessKeyId: result.AccessKey.AccessKeyId,
            AccessKeySecret: result.AccessKey.AccessKeySecret,
            UserName: user.UserName,
          })
          .then(function () {
            refresh();
          });
      });
    }

    function cancel() {
      $modalInstance.dismiss("close");
    }
  },
]);

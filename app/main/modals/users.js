"use strict";

angular.module("web").controller("usersCtrl", [
  "$scope",
  "$rootScope",
  "$q",
  "$translate",
  "$state",
  "$uibModalInstance",
  "$uibModal",
  "ramSvs",
  "Dialog",
  "Toast",
  function (
    $scope,
    $rootScope,
    $q,
    $translate,
    $state,
    $modalInstance,
    $modal,
    ramSvs,
    Dialog,
    Toast
  ) {
    var T = $translate.instant;
    angular.extend($scope, {
      items: [],
      isLoading: false,
      err: null,
      sch: {
        txt: "",
      },
      open: function () {},
      cancel: cancel,
      refresh: refresh,
      showUpdate: showUpdate,
      showRemove: showRemove,
      showAK: showAK,
    });

    refresh();
    function refresh() {
      $scope.isLoading = true;
      $scope.err = null;
      ramSvs.listUsers().then(
        function (arr) {
          $scope.isLoading = false;
          arr.sort(function (a, b) {
            return a.UpdateDate < b.UpdateDate ? 1 : -1;
          });
          $scope.items = arr;
          //UserId, UserName, DisplayName, CreateDate, UpdateDate, Comments;
        },
        function (err) {
          $scope.err = err;
          $scope.isLoading = false;
        }
      );
    }

    function cancel() {
      $modalInstance.dismiss("close");
    }

    function showUpdate(item) {
      $modal.open({
        templateUrl: "main/modals/user-update.html",
        controller: "userUpdateCtrl",
        resolve: {
          item: function () {
            return item;
          },
          callback: function () {
            return function () {
              refresh();
            };
          },
        },
      });
    }
    function showAK(item) {
      $modal.open({
        templateUrl: "main/modals/user-ak.html",
        controller: "userAKCtrl",
        size: "lg",
        resolve: {
          user: function () {
            return item;
          },
          callback: function () {
            return function () {
              refresh();
            };
          },
        },
      });
    }

    function showRemove(item) {
      var title = T("user.delete.title");
      var message = T("user.delete.message", { name: item.UserName });

      Dialog.confirm(title, message, function (b) {
        if (!b) return;
        Toast.info(T("user.delete.on"));
        ramSvs.listPoliciesForUser(item.UserName).then(function (result) {
          var arr = result.Policies.Policy;
          dig(arr, function (n) {
            return ramSvs.detachPolicyFromUser(n.PolicyName, item.UserName);
          }).then(function () {
            ramSvs.listAccessKeys(item.UserName).then(function (result) {
              var arr = result.AccessKeys.AccessKey;
              dig(arr, function (n) {
                return ramSvs.deleteAccessKey(item.UserName, n.AccessKeyId);
              }).then(function () {
                //删除
                ramSvs.deleteUser(item.UserName).then(function () {
                  Toast.success(T("user.delete.success"));
                  refresh();
                });
              });
            });
          });
        });
      });

      function dig(arr, fn) {
        var len = arr.length;
        var c = 0;
        var df = $q.defer();
        _();
        function _() {
          if (c >= len) {
            df.resolve();
            return;
          }
          fn(arr[c]).then(function () {
            c++;
            _();
          });
        }
        return df.promise;
      }
    }
  },
]);

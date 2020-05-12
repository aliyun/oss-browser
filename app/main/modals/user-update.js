"use strict";

angular.module("web").controller("userUpdateCtrl", [
  "$scope",
  "$rootScope",
  "$translate",
  "$state",
  "$uibModalInstance",
  "item",
  "callback",
  "ramSvs",
  "Toast",
  "Const",
  function (
    $scope,
    $rootScope,
    $translate,
    $state,
    $modalInstance,
    item,
    callback,
    ramSvs,
    Toast,
    Const
  ) {
    var T = $translate.instant;

    var countryNum = angular.copy(Const.countryNum);
    var countryNumMap = {};
    angular.forEach(countryNum, function (n) {
      countryNumMap[n.value] = n;
    });

    angular.extend($scope, {
      reg: {
        email: Const.REG.EMAIL,
      },
      item: initNewItem(item),
      cancel: cancel,
      countryNum: countryNum,
      countryNumMap: countryNumMap,
      onSubmit: onSubmit,
    });

    init();
    function init() {
      var numkv = angular.copy(countryNum[0]);
      $scope.item._MobilePhonePre = numkv.value;
      $scope.item._MobilePhoneNum = "";

      if (item.UserId) {
        ramSvs.getUser(item.UserName).then(function (result) {
          angular.extend($scope.item, initNewItem(result.User));
        });
      }
    }
    function initNewItem(item) {
      var info = {
        UserName: item.UserName,
        NewUserName: item.UserName,
        NewDisplayName: item.DisplayName,
        NewMobilePhone: item.MobilePhone,
        NewEmail: item.Email,
        NewComments: item.Comments,
      };
      if (item.MobilePhone) {
        var numkv = item.MobilePhone.split("-");
        info._MobilePhonePre = numkv[0];
        info._MobilePhoneNum = numkv[1];
      }
      return info;
    }

    function onSubmit(form1) {
      if (!form1.$valid) return;

      var item = angular.copy($scope.item);
      if (item._MobilePhonePre && item._MobilePhoneNum) {
        item.NewMobilePhone = item._MobilePhonePre + "-" + item._MobilePhoneNum;
      } else {
        item.NewMobilePhone = "";
      }
      delete item._MobilePhonePre;
      delete item._MobilePhoneNum;

      //console.log(item);
      ramSvs.updateUser(item).then(function (result) {
        callback();
        cancel();
      });
    }

    function cancel() {
      $modalInstance.dismiss("close");
    }
  },
]);

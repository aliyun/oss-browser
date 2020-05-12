"use strict";

angular.module("web").filter("listFilter", function () {
  return function (arr, keyFn, value) {
    if (!value) return arr;
    if (arr && arr.length > 0) {
      var t = [];
      if (typeof keyFn == "string") {
        angular.forEach(arr, function (n) {
          if (n[keyFn].indexOf(value) != -1) {
            t.push(n);
          }
        });
      } else if (typeof keyFn == "function") {
        angular.forEach(arr, function (n) {
          if (keyFn(n).indexOf(value) != -1) {
            t.push(n);
          }
        });
      }
      return t;
    }
    return [];
  };
});

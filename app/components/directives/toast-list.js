/*
usage:

step 1. add element to body:
  <toast-list></toast-list>

step 2: use Toast factory
  Toast.info('test');
*/

angular
  .module("web")
  .directive("toastList", function () {
    return {
      //link: linkFn,
      restrict: "EA",
      template: `
        <div class="toast-list" style="position: fixed; bottom: 0px;left: 10px;right: 70%;z-index:10000;">
          <div ng-repeat="alert in alerts" style="padding:4px;margin-bottom:10px;" class="break alert alert-{{alert.type}}">
            <p style="margin: 0">{{alert.msg}}<p>
            <p ng-if="alert.requestId" style="margin: 0">
              RequestId: {{alert.requestId}}
              <button ng-click="copyClip(alert.requestId)">复制</button>
            <p>
          </div>
        </div>`,
      controller: [
        "$scope",
        "$timeout",
        "$location",
        function ($scope, $timeout) {
          const { clipboard } = require("electron");

          $scope.alerts = [];

          // $scope.closeAlert = function(index){
          //   $scope.alerts.splice(index, 1);
          // };

          $scope.$on("message", function (evt, data) {
            showMessage(
              data.message,
              data.type || "danger",
              data.ttl || 3000,
              data.requestId
            );
          });

          $scope.copyClip = function (text) {
            clipboard.writeText(text);
          };

          function showMessage(msg, type, ttl, requestId) {
            var obj = {
              type: type || "danger",
              msg: msg || "",
              id: Math.random(),
              requestId: requestId,
            };

            //next tick
            $timeout(function () {
              $scope.alerts.push(obj);
              $timeout(function () {
                for (var i = 0; i < $scope.alerts.length; i++) {
                  if ($scope.alerts[i] == obj) {
                    $scope.alerts.splice(i, 1);
                    break;
                  }
                }
              }, ttl || 3000);
            }, 0);
          }
        },
      ],
    };
  })

  .factory("Toast", [
    "$rootScope",
    function ($rootScope) {
      return {
        success: function (msg, ttl) {
          sendMessage(msg, "success", ttl);
        },
        info: function (msg, ttl) {
          sendMessage(msg, "info", ttl);
        },
        warn: function (msg, ttl) {
          sendMessage(msg, "warning", ttl);
        },
        warning: function (msg, ttl) {
          sendMessage(msg, "warning", ttl);
        },
        error: function (msg, ttl, requestId) {
          sendMessage(msg, "danger", ttl, requestId);
        },
      };

      function sendMessage(msg, type, ttl, requestId) {
        $rootScope.$broadcast("message", {
          message: msg,
          type: type,
          ttl: ttl,
          requestId: requestId,
        });
      }
    },
  ]);

/*
 <input type="text" ng-model="abc" cleanable-input x="-3" y="-5"/>
 */

angular.module("web").directive("cleanableInput", [
  "$timeout",
  function ($timeout) {
    return {
      restrict: "EA",
      require: "ngModel",

      scope: {
        model: "=ngModel",
        ngChange: "&",
        x: "=",
        y: "=",
      },
      link: function link(scope, element) {
        var id = "cleanable_inp-" + (Math.random() + "").substring(2);

        element.wrap(
          '<div id="' + id + '" style="position:relative;width:100%;"></div>'
        );
        var btn = $(
          '<a href="" style="font-size:14px;color:#999">' +
            '<i class="glyphicon glyphicon-remove-circle"></i></a>'
        ).appendTo($("#" + id));

        btn
          .css({
            display: "none",
            position: "absolute",
            "z-index": 10,
          })
          .click(function (e) {
            scope.model = "";
            if (!scope.$root.$$phase) {
              scope.$apply();
            }

            if (scope.ngChange) {
              scope.$eval(scope.ngChange);
            }

            return false;
          });

        var y = isNaN(scope.y) ? 0 : parseInt(scope.y);
        var x = isNaN(scope.x) ? 0 : parseInt(scope.x);

        function onchange(v) {
          if (v && v !== "") {
            btn
              .css({
                top: 6 + y,
                right: 6 - x,
              })
              .show();
          } else {
            btn.hide();
          }
        }

        // Listen for any changes to the original model.
        var tid;
        scope.$watch(
          "model",
          function alteredValues(newValue, oldValue) {
            $timeout.cancel(tid);
            tid = $timeout(function () {
              onchange(newValue);
            }, 300);
          },
          true
        );
      },
    };
  },
]);

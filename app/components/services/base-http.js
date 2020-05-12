// register the interceptor as a service
angular
  .module("web")

  .factory("BaseHttp", [
    "$http",
    "$rootScope",
    "$timeout",
    function ($http, $rootScope, $timeout) {
      return function (opt) {
        $rootScope.onRequest = true;

        opt.headers = opt.headers || {};
        //for server side: req.xhr
        if (!opt.headers["X-Requested-With"]) {
          opt.headers["X-Requested-With"] = "XMLHttpRequest";
        }

        if (opt.url.indexOf("http") != 0) {
          opt.url = Global.endpoint + opt.url;
        }
        var httpPromise = $http(opt);

        httpPromise.success(function (data, status, header) {
          setOnRequestFalse();
        });

        httpPromise.error(function (err, status, header) {
          if (opt.params && opt.params.ignoreError) {
            //pass
          } else if (opt.data && opt.data.ignoreError) {
            //pass
          } else {
            $rootScope.$broadcast("http_error_message", err);
          }
          setOnRequestFalse();
        });

        return httpPromise;
      };

      var tid;

      function setOnRequestFalse() {
        $timeout.cancel(tid);
        tid = $timeout(function () {
          $rootScope.onRequest = false;
        }, 600);
      }
    },
  ]);

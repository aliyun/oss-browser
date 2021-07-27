angular.module('web').factory('Auth', [
  '$q',
  '$rootScope',
  '$location',
  '$translate',
  'ossSvs2',
  'AuthInfo',
  function($q, $rootScope, $location, $translate, ossSvs2, AuthInfo) {
    var T = $translate.instant;

    return {
      login: login,
      logout: logout
    };

    function login(data) {
      if (!data.osspath) { delete data.region; }

      var df = $q.defer();

      data.httpOptions = { timeout: 15000 };

      if (data.id.indexOf('STS.') != 0) {
        delete data.stoken;
      }

      $rootScope.internalSupported = data.eptpl
        ? data.eptpl.indexOf('-internal') != -1
        : false;

      if (data.osspath) {
        var info = ossSvs2.parseOSSPath(data.osspath);

        data.bucket = info.bucket;

        ossSvs2
            .getClient2(data)
            .listV2({
              prefix: info.key,
              'max-keys': 1,
              delimiter: '/'
            })
            .then((result) => {
              if (result.keyCount !== '0') {
              // 登录成功
                AuthInfo.save(data);
                df.resolve();
              } else {
                df.reject({
                  code: 'Error',
                  message: T('login.endpoint.error')
                }); // '请确定Endpoint是否正确'
              }
            })
            ['catch']((err) => {
              df.reject(err);
            });
      } else {
        ossSvs2.getClient(data).listBuckets(function(err, result) {
          if (err) {
            if (err.code == 'AccessDeniedError') {
              // 登录成功
              AuthInfo.save(data);
              df.resolve();
            } else {
              // 失败
              df.reject(err);
            }
          } else if (result.RequestId && result.Buckets) {
            // 登录成功
            AuthInfo.save(data);
            df.resolve();
          } else {
            df.reject({ code: 'Error', message: T('login.endpoint.error') });
          }
        });
      }

      return df.promise;
    }

    function logout() {
      $rootScope.bucketMap = {};
      var df = $q.defer();

      AuthInfo.remove();
      df.resolve();

      return df.promise;
    }
  }
]);

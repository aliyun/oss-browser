angular.module('web')
  .factory('Auth', ['$q', '$location','ossSvs','AuthInfo','Const','Cipher',
  function ($q, $location,ossSvs, AuthInfo, Const, Cipher) {
 
    return {
      login: login,
      logout: logout
    };

    function login(data) {
      var df = $q.defer();

      ossSvs.getClient(data).listBuckets().then(function(result) {
          //登录成功
          AuthInfo.save(data);
          df.resolve();

      },function(err){
        if (err.code == 'AccessDeniedError') {
          //登录成功
          AuthInfo.save(data);
          df.resolve();
        } else {
          //失败
          df.reject(err);
        }
      });
      return df.promise;
    }

    function logout() {
      var df = $q.defer();
      AuthInfo.remove();
      df.resolve();
      return df.promise;
    }

  }]);

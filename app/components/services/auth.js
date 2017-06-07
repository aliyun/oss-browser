angular.module('web')
  .factory('Auth', ['$q', '$location', 'ossSvs2', 'AuthInfo', 'Const', 'Cipher',
    function($q, $location, ossSvs2, AuthInfo, Const, Cipher) {

      return {
        login: login,
        logout: logout
      };

      function login(data) {
        var df = $q.defer();

        if (data.osspath) {

          var info = ossSvs2.parseOSSPath(data.osspath);
          data.bucket = info.bucket;

          ossSvs2.getClient(data).listObjects({Bucket: info.bucket, Prefix: info.key, Marker:'',MaxKeys:1}, function(err, result){
            if(err){
              df.reject(err);
            }
            else{
              //登录成功
              AuthInfo.save(data);
              df.resolve();
            }
          });

        } else {
          ossSvs2.getClient(data).listBuckets( function(err, result) {
            
            if(err){
              if (err.code == 'AccessDeniedError') {
                //登录成功
                AuthInfo.save(data);
                df.resolve();
              } else {
                //失败
                df.reject(err);
              }
            }else{
              //登录成功
              AuthInfo.save(data);
              df.resolve();
            }
          });
        }


        return df.promise;
      }

      function logout() {
        var df = $q.defer();
        AuthInfo.remove();
        df.resolve();
        return df.promise;
      }

    }
  ]);

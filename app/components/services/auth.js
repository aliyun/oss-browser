angular.module('web')
  .factory('Auth', ['$q', '$location','$translate', 'ossSvs2', 'AuthInfo', 'Const', 'Cipher',
    function($q, $location, $translate, ossSvs2, AuthInfo, Const, Cipher) {
      var T = $translate.instant;
      return {
        login: login,
        logout: logout
      };

      function login(data) {
        if(!data.osspath)delete data.region;

        var df = $q.defer();
        data.httpOptions={timeout:15000};

        if(data.id.indexOf('STS.')!=0){
          delete data.stoken;
        }

        if (data.osspath) {

          var info = ossSvs2.parseOSSPath(data.osspath);
          data.bucket = info.bucket;

          ossSvs2.getClient(data).listObjects({Bucket: info.bucket, Prefix: info.key, Marker:'',MaxKeys:1}, function(err, result){

            if(err){
              df.reject(err);
            }
            else if(result.RequestId && result.CommonPrefixes){
              //登录成功
              AuthInfo.save(data);
              df.resolve();
            }
            else{
              df.reject({code:'Error',message:T('login.endpoint.error')}); //'请确定Endpoint是否正确'
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
            }
            else if(result.RequestId && result.Buckets){
              //登录成功
              AuthInfo.save(data);
              df.resolve();
            }else{
              df.reject({code:'Error',message:T('login.endpoint.error')});
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

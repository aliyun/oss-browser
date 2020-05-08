angular.module("web").factory("stsSvs", [
  "$q",
  "$state",
  "AuthInfo",
  "Toast",
  "Const",
  function ($q, $state, AuthInfo, Toast, Const) {
    var ALYD = require("aliyun-sdk");
    return {
      assumeRole: assumeRole,
    };

    /**
    * @param roleArn RoleArn表示的是需要扮演的角色ID，角色的ID可以在 角色管理 > 角色详情 中找到。
                     格式如： "acs:ram::1894189769722283:role/ramtestappreadonly"
    * @param policyStr 表示的是在扮演角色的时候额外加上的一个权限限制。
                     格式如：'{"Version":"1","Statement":[{"Effect":"Allow", "Action":"*", "Resource":"*"}]}'
    * @param seconds  DurationSeconds指的是临时凭证的有效期，单位是s，最小为900，最大为3600。
    */
    function assumeRole(roleArn, policyStr, seconds) {
      var sts = getClient();
      var df = $q.defer();

      // 构造AssumeRole请求
      sts.assumeRole(
        {
          Action: "AssumeRole",
          // 指定角色Arn
          RoleArn: roleArn,
          //设置Token的附加Policy，可以在获取Token时，通过额外设置一个Policy进一步减小Token的权限；
          Policy: policyStr, //'{"Version":"1","Statement":[{"Effect":"Allow", "Action":"*", "Resource":"*"}]}',
          //设置Token有效期，可选参数，默认3600秒；
          DurationSeconds: seconds || 3600,
          RoleSessionName: "oss-browser", // RoleSessionName是一个用来标示临时凭证的名称，一般来说建议使用不同的应用程序用户来区分。usr001
        },
        function (err, result) {
          if (err) {
            df.reject(err);
            handleError(err);
          } else {
            df.resolve(result);
          }
        }
      );
      return df.promise;
    }

    function handleError(err) {
      if (err.code == "InvalidAccessKeyId") {
        $state.go("login");
      } else {
        if (!err.code) {
          if (err.message.indexOf("Failed to fetch") != -1) {
            err = { code: "Error", message: "无法连接" };
          } else err = { code: "Error", message: err.message };
        } else if (
          err.message.indexOf("You are not authorized to do this action") != -1
        ) {
          err = { code: "Error", message: "没有权限, " + err.message };
        }

        Toast.error(err.code + ": " + err.message);
      }
    }

    function getClient() {
      var authInfo = AuthInfo.get();
      var ram = new ALYD.STS({
        accessKeyId: authInfo.id,
        secretAccessKey: authInfo.secret,
        endpoint: "https://sts.aliyuncs.com",
        apiVersion: "2015-04-01",
      });
      return ram;
    }
  },
]);

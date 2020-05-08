angular.module("web").factory("ramSvs", [
  "$q",
  "$state",
  "AuthInfo",
  "Toast",
  "Const",
  function ($q, $state, AuthInfo, Toast, Const) {
    var ALYD = require("aliyun-sdk");
    return {
      listUsers: listUsers,
      listGroups: listGroups,
      listRoles: listRoles,

      createPolicy: createPolicy,
      getPolicy: getPolicy,
      attachPolicyToRole: attachPolicyToRole,
      attachPolicyToGroup: attachPolicyToGroup,
      attachPolicyToUser: attachPolicyToUser,
      detachPolicyFromUser: detachPolicyFromUser,
      listPoliciesForUser: listPoliciesForUser,

      getUser: getUser,
      createUser: createUser,
      updateUser: updateUser,
      deleteUser: deleteUser,

      createAccessKey: createAccessKey,
      updateAccessKey: updateAccessKey,
      deleteAccessKey: deleteAccessKey,
      listAccessKeys: listAccessKeys,
    };

    function listPoliciesForUser(username) {
      var ram = getClient();
      var df = $q.defer();
      ram.listPoliciesForUser(
        {
          UserName: username,
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

    function deleteUser(username) {
      var ram = getClient();
      var df = $q.defer();
      ram.deleteUser(
        {
          UserName: username,
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

    function getUser(username) {
      var ram = getClient();
      var df = $q.defer();
      ram.getUser(
        {
          UserName: username,
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

    function updateUser(item) {
      var ram = getClient();
      var df = $q.defer();
      ram.updateUser(item, function (err, result) {
        if (err) {
          df.reject(err);
          handleError(err);
        } else {
          df.resolve(result);
        }
      });
      return df.promise;
    }

    function createUser(opt) {
      if (typeof opt == "string") {
        opt = {
          UserName: opt,
        };
      }

      var ram = getClient();
      var df = $q.defer();

      console.log("createUser:", opt);
      ram.createUser(opt, function (err, result) {
        if (err) {
          df.reject(err);
          handleError(err);
        } else {
          df.resolve(result);
        }
      });
      return df.promise;
    }

    function listAccessKeys(username) {
      var ram = getClient();
      var df = $q.defer();
      ram.listAccessKeys(
        {
          UserName: username,
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

    function createAccessKey(username) {
      var ram = getClient();
      var df = $q.defer();
      ram.createAccessKey(
        {
          UserName: username,
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
    function updateAccessKey(username, userAccessKeyId, status) {
      var ram = getClient();
      var df = $q.defer();
      ram.updateAccessKey(
        {
          UserName: username,
          UserAccessKeyId: userAccessKeyId,
          Status: status,
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
    function deleteAccessKey(username, userAccessKeyId) {
      var ram = getClient();
      var df = $q.defer();
      ram.deleteAccessKey(
        {
          UserName: username,
          UserAccessKeyId: userAccessKeyId,
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

    function createPolicy(name, doc, desc) {
      var ram = getClient();
      var df = $q.defer();
      ram.createPolicy(
        {
          PolicyName: name,
          PolicyDocument: doc,
          Description: desc,
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

    function getPolicy(name, type, ignoreError) {
      var ram = getClient();
      var df = $q.defer();
      ram.getPolicy(
        {
          PolicyName: name,
          PolicyType: type,
        },
        function (err, result) {
          if (err) {
            df.reject(err);
            if (!ignoreError) handleError(err);
          } else {
            df.resolve(result);
          }
        }
      );
      return df.promise;
    }

    function attachPolicyToUser(policyName, userName) {
      return attachPolicy("attachPolicyToUser", {
        PolicyName: policyName,
        UserName: userName,
        PolicyType: "Custom",
      });
    }
    function attachPolicyToGroup(policyName, groupName) {
      return attachPolicy("attachPolicyToGroup", {
        PolicyName: policyName,
        GroupName: groupName,
        PolicyType: "Custom",
      });
    }
    function attachPolicyToRole(policyName, roleName) {
      return attachPolicy("attachPolicyToRole", {
        PolicyName: policyName,
        RoleName: roleName,
        PolicyType: "Custom",
      });
    }
    function detachPolicyFromUser(policyName, userName) {
      return attachPolicy("detachPolicyFromUser", {
        UserName: userName,
        PolicyName: policyName,
        PolicyType: "Custom",
      });
    }

    function attachPolicy(callFn, opt) {
      var ram = getClient();
      var df = $q.defer();
      ram[callFn].call(ram, opt, function (err, result) {
        if (err) {
          df.reject(err);
          handleError(err);
        } else {
          df.resolve(result);
        }
      });
      return df.promise;
    }

    function listUsers(ignoreError) {
      return listAll("listUsers", "User", ignoreError);
    }
    function listGroups(ignoreError) {
      return listAll("listGroups", "Group", ignoreError);
    }
    function listRoles(ignoreError) {
      return listAll("listRoles", "Role", ignoreError);
    }

    function listAll(callFn, resultKey, ignoreError) {
      var ram = getClient();
      var df = $q.defer();
      var t = [];

      function dig(marker) {
        var opt = { MaxItems: 100 };
        if (marker) opt.Marker = marker;
        ram[callFn].call(ram, opt, function (err, res) {
          if (err) {
            df.reject(err);
            if (!ignoreError) handleError(err);
            return;
          }

          var marker2 = res.Marker;
          t = t.concat(res[resultKey + "s"][resultKey]);
          if (marker2) {
            dig(marker2);
          } else {
            df.resolve(t);
          }
        });
      }
      dig();
      return df.promise;
    }

    function handleError(err) {
      console.error(err);
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
      var ram = new ALYD.RAM({
        accessKeyId: authInfo.id,
        secretAccessKey: authInfo.secret,
        endpoint: "https://ram.aliyuncs.com",
        apiVersion: "2015-05-01",
      });
      return ram;
    }
  },
]);

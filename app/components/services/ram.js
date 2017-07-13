angular.module('web')
  .factory('ramSvs', ['$q','$state','AuthInfo','Toast','Const',
  function ( $q, $state, AuthInfo, Toast,Const ) {

    var ALYD = require('aliyun-sdk');
    return {
       listUsers: listUsers,
       listGroups: listGroups,
       listRoles: listRoles,

       createPolicy: createPolicy,
       attachPolicyToRole: attachPolicyToRole,
       attachPolicyToGroup: attachPolicyToGroup,
       attachPolicyToUser: attachPolicyToUser,
    };

    function createPolicy(name, doc, desc){
      var ram = getClient();
      var df = $q.defer();
      ram.createPolicy({
        PolicyName: name,
        PolicyDocument: doc,
        Description: desc
      }, function(err, result){
        if(err){
          df.reject(err);
          handleError(err);
        }
        else{
          df.resolve(result);
        }
      });
      return df.promise;
    }
    function attachPolicyToUser(policyName, userName){
      return attachPolicy('attachPolicyToUser',{
        PolicyName: policyName,
        UserName: userName,
        PolicyType: 'Custom'
      });
    }
    function attachPolicyToGroup(policyName, groupName){
      return attachPolicy('attachPolicyToGroup',{
        PolicyName: policyName,
        GroupName: groupName,
        PolicyType: 'Custom'
      });
    }
    function attachPolicyToRole(policyName, roleName){
      return attachPolicy('attachPolicyToRole',{
        PolicyName: policyName,
        RoleName: roleName,
        PolicyType: 'Custom'
      });
    }
    function attachPolicy(callFn, opt){
      var ram = getClient();
      var df = $q.defer();
      ram[callFn].call(ram, opt, function(err, result){
        if(err){
          df.reject(err);
          handleError(err);
        }
        else{
          df.resolve(result);
        }
      });
      return df.promise;
    }

    function listUsers(ignoreError){
      return listAll('listUsers','User',ignoreError);
    }
    function listGroups(ignoreError){
      return listAll('listGroups','Group',ignoreError);
    }
    function listRoles(ignoreError){
      return listAll('listRoles','Role',ignoreError);
    }

    function listAll(callFn, resultKey, ignoreError){
      var ram = getClient();
      var df = $q.defer();
      var t=[];

      function dig(marker){
        var opt= {};
        if(marker)opt.marker=marker;
        ram[callFn].call(ram, opt, function(err, res){
          if(err){
            df.reject(err);
            if(!ignoreError) handleError(err);
            return;
          }
          var marker = res.Marker;
          t = t.concat(res[resultKey+'s'][resultKey]);
          if(marker){
            dig(marker);
          }
          else{
            df.resolve(t);
          }
        });
      }
      dig();
      return df.promise;
    }

    function handleError(err) {
      if(err.code=='InvalidAccessKeyId'){
        $state.go('login');
      }
      else{
        if(!err.code){
          if(err.message.indexOf('Failed to fetch')!=-1){
            err={code:'Error',message:'无法连接'};
          }
          else err={code:'Error',message:err.message};
        }
        else if(err.message.indexOf('You are not authorized to do this action')!=-1){
          err={code:'Error',message:'没有权限, '+err.message};
        }

        Toast.error(err.code+': '+err.message);
      }
    }

    function getClient(){

      var authInfo = AuthInfo.get();
      var ram = new ALYD.RAM({
        accessKeyId: authInfo.id,
        secretAccessKey: authInfo.secret,
        endpoint: 'https://ram.aliyuncs.com',
        apiVersion: '2015-05-01'
      });
      return ram;
    }

  }])
  ;

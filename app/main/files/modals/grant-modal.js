angular.module('web')
  .controller('grantModalCtrl', ['$scope', '$q', '$uibModalInstance','$translate', 'items', 'currentInfo','ramSvs','Toast', 'safeApply',
    function ($scope, $q, $modalInstance, $translate, items, currentInfo,ramSvs, Toast, safeApply) {
      var T = $translate.instant;
      angular.extend($scope, {
        cancel: cancel,
        policyChange: policyChange,
        onSubmit: onSubmit,
        items: items,
        grant: {
          toTypes: ['group', 'user', 'role'],
          toType: 'user',
          privTypes: ['readOnly','all'],
          privType: 'readOnly',
        },
        policyNameReg: /^[a-z0-9A-Z\-]{1,128}$/
      });

      init();
      function init(){

        policyChange();
        var ignoreError = true;

        ramSvs.listUsers(ignoreError).then(function(result){
           $scope.users = result;
        }, function(err){
          $scope.users = [];
          if(err.message.indexOf('You are not authorized to do this action')!=-1){
            Toast.error(T('simplePolicy.noauth.message1')); //'没有权限获取用户列表'
          }
        });
        ramSvs.listGroups(ignoreError).then(function(result){
           $scope.groups = result;
        },function(err){
          $scope.groups = [];
          if(err.message.indexOf('You are not authorized to do this action')!=-1){
            Toast.error(T('simplePolicy.noauth.message2')); //'没有权限获取用户组列表'
          }
        });
        ramSvs.listRoles(ignoreError).then(function(result){
           $scope.roles = result;
        },function(err){
          $scope.roles = [];

          if(err.message.indexOf('You are not authorized to do this action')!=-1){
            Toast.error(T('simplePolicy.noauth.message3')); //'没有权限获取角色列表'
          }
        });
      }

      //Object的读操作包括：GetObject，HeadObject，CopyObject和UploadPartCopy中的对source object的读；
      //Object的写操作包括：PutObject，PostObject，AppendObject，DeleteObject，DeleteMultipleObjects，CompleteMultipartUpload以及CopyObject对新的Object的写。

      function cancel() {
        $modalInstance.dismiss('close');
      }

      function genPolicy(privType) {
        var t = [];

        var actions = [];
        if(privType=='readOnly'){
          actions = ['oss:GetObject',
            'oss:HeadObject',
            "oss:GetObjectMeta",
            "oss:GetObjectACL",
            'oss:ListObjects',
            'oss:GetSymlink'
          ];
        }
        else{
          actions = ['oss:*'];
        }

        angular.forEach($scope.items, function (item) {
          if (item.region || item.isFolder) {

            var bucket = item.region?item.name: currentInfo.bucket;
            var key = item.path||'';
            t.push({
              "Effect": "Allow",
              "Action": actions,
              "Resource": [
                "acs:oss:*:*:" + bucket + "/" + key + "*"
              ]
            });


            t.push({
              "Effect": "Allow",
              "Action": [
                "oss:ListObjects"
              ],
              "Resource": [
                "acs:oss:*:*:" + bucket
              ],
              "Condition": {
                "StringLike": {
                  "oss:Prefix": key + "*"
                }
              }
            });

          } else {
            //文件所有权限
            t.push({
              "Effect": "Allow",
              "Action": actions,
              "Resource": [
                "acs:oss:*:*:" + currentInfo.bucket + "/" + item.path
              ]
            });
          }
        });

        return {
          "Version": "1",
          "Statement": t
        };
      }

      var policy;
      function policyChange(){
        var privType = $scope.grant.privType;
        policy = genPolicy(privType);
        $scope.grant.policy = JSON.stringify(policy,' ',2);

        var name =  (Math.random()+'').substring(2);
        if($scope.items && $scope.items.length==1){
          name = $scope.items[0].name.replace(/[\W_]+/g,'-');
        }
        $scope.grant.policyName = 'plc-'+ privType +'-'+ name;
      }

      function onSubmit(form1) {
        if (!form1.$valid) return false;
        var policyName= $scope.grant.policyName;

        var title = T('simplePolicy.title');//简化policy授权
        var successMsg = T('simplePolicy.success');//'应用policy成功'
        ramSvs.createPolicy(policyName,$scope.grant.policy, title).then(function(){
          switch($scope.grant.toType){
            case 'user':
              ramSvs.attachPolicyToUser(policyName, $scope.grant.userName).then(function(){
                Toast.success(successMsg);
                cancel();
              });
              break;
            case 'group':
              ramSvs.attachPolicyToGroup(policyName, $scope.grant.groupName).then(function(){
                Toast.success(successMsg);
                cancel();
              });
              break;
            case 'role':
              ramSvs.attachPolicyToRole(policyName, $scope.grant.roleName).then(function(){
                Toast.success(successMsg);
                cancel();
              });
              break;
          }
        });


      }

    }
  ]);

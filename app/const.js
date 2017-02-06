
angular.module('web')
.factory('Const', function(){
  return {
    AUTH_INFO_KEY: 'auth-info',
    AUTH_HIS: 'auth-his',
    AUTH_KEEP: 'auth-keep',
    KEY_REMEMBER: 'auth-remember',
    SHOW_HIS: 'show-his',

    bucketACL: [
      {acl:'public-read',label:'公共读'},
      {acl:'public-read-write',label:'公共读写'},
      {acl:'private',label:'私有'}
    ],
    regions: [
      {id: 'oss-cn-hangzhou', label: '华东1(杭州)'},
      {id: 'oss-cn-shanghai', label: '华东2(上海)'},
      {id: 'oss-cn-qingdao', label: '华北1(青岛)'},
      {id: 'oss-cn-beijing', label: '华北2(北京)'},
      {id: 'oss-cn-shenzhen', label: '华南1(深圳)'},
      {id: 'oss-cn-hongkong', label: '香港数据中心'},
      {id: 'oss-us-west-1', label: '美国硅谷数据中心'},
      {id: 'oss-us-east-1', label: '美国弗吉尼亚数据中心'},
      {id: 'oss-ap-southeast-1', label: '亚太（新加坡）数据中心'},
    ]
  };
})
;

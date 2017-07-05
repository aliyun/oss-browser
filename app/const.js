
angular.module('web')
.factory('Const', function(){


  function getStorageClasses(f){
    var storageClasses = [{value:'Standard',name:'标准类型'},{value:'IA',name:'低频访问类型'}];
    switch(f){
      case 3: return storageClasses.concat([{value:'Archive',name:'归档类型'}]);
      case 2: return storageClasses;
      default: return [{value:'Standard',name:'标准类型'}];
    }
  }

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

    //https://help.aliyun.com/document_detail/31837.html
    regions: [
      {id: 'oss-cn-hangzhou', label: '华东1(杭州)', storageClasses: getStorageClasses(3)},
      {id: 'oss-cn-shanghai', label: '华东2(上海)', storageClasses: getStorageClasses(2)},
      {id: 'oss-cn-qingdao', label: '华北1(青岛)', storageClasses: getStorageClasses(2)},
      {id: 'oss-cn-beijing', label: '华北2(北京)', storageClasses: getStorageClasses(3)},
      {id: 'oss-cn-zhangjiakou', label: '华北3(张家口)', storageClasses: getStorageClasses(2)},
      {id: 'oss-cn-shenzhen', label: '华南1(深圳)', storageClasses: getStorageClasses(3)},
      {id: 'oss-cn-hongkong', label: '香港', storageClasses: getStorageClasses(2)},

      {id: 'oss-ap-southeast-1', label: '亚太东南1(新加坡)', storageClasses: getStorageClasses(2)},
      {id: 'oss-ap-southeast-2', label: '亚太东南2(悉尼)', storageClasses: getStorageClasses(2)},
      {id: 'oss-ap-northeast-1', label: '亚太东北1(东京)', storageClasses: getStorageClasses(0)},

      {id: 'oss-us-west-1', label: '美国西部1(硅谷)', storageClasses: getStorageClasses(2)},
      {id: 'oss-us-east-1', label: '美国东部1(弗吉尼亚)',storageClasses: getStorageClasses(2)},
      {id: 'oss-eu-central-1', label: '欧洲中部1(法兰克福)',storageClasses: getStorageClasses(2)},
      {id: 'oss-me-east-1', label: '中东东部1(迪拜)',storageClasses: getStorageClasses(0)},
    ]
  };
})
;

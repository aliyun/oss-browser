
angular.module('web')
.factory('Const', [function(){

  function getStorageClasses(f){
    var storageClasses = [
      {value:'Standard',name: '标准类型'}, //标准类型
      {value:'IA',name: '低频访问类型'} //低频访问类型
    ];
    switch(f){
      case 3: return storageClasses.concat([{value:'Archive',name: '归档类型'}]); //归档类型
      case 2: return storageClasses;
      default: return [{value:'Standard',name: '标准类型'}]; //标准类型
    }
  }


  return {
    AUTH_INFO_KEY: 'auth-info',
    AUTH_HIS: 'auth-his',
    AUTH_KEEP: 'auth-keep',
    KEY_REMEMBER: 'auth-remember',
    SHOW_HIS: 'show-his',

    REG: {
      EMAIL:  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    },

    bucketACL: [
      {acl:'private',label: '私有'}, //私有
      {acl:'public-read',label: '公共读'}, //公共读
      {acl:'public-read-write',label: '公共读写'}, //公共读写
    ],

    //https://help.aliyun.com/document_detail/31837.html
    regions: [
      {id: 'oss-cn-hangzhou', label: '华东1(杭州)', storageClasses: getStorageClasses(3)},
      {id: 'oss-cn-shanghai', label: '华东2(上海)', storageClasses: getStorageClasses(3)},
      {id: 'oss-cn-qingdao', label: '华北1(青岛)', storageClasses: getStorageClasses(3)},
      {id: 'oss-cn-beijing', label: '华北2(北京)', storageClasses: getStorageClasses(3)},
      {id: 'oss-cn-zhangjiakou', label: '华北3(张家口)', storageClasses: getStorageClasses(3)},
      {id: 'oss-cn-huhehaote', label: '华北5(呼和浩特)', storageClasses: getStorageClasses(3)},
      {id: 'oss-cn-shenzhen', label: '华南1(深圳)', storageClasses: getStorageClasses(3)},
      {id: 'oss-cn-hongkong', label: '香港', storageClasses: getStorageClasses(3)},

      {id: 'oss-ap-southeast-1', label: '亚太东南1(新加坡)', storageClasses: getStorageClasses(3)},
      {id: 'oss-ap-southeast-2', label: '亚太东南2(悉尼)', storageClasses: getStorageClasses(3)},
      {id: 'oss-ap-southeast-3', label: '亚太东南3(吉隆坡)', storageClasses: getStorageClasses(3)},
      {id: 'oss-ap-southeast-5', label: '亚太东南5(雅加达)', storageClasses: getStorageClasses(3)},
      {id: 'oss-ap-northeast-1', label: '亚太东北1(东京)', storageClasses: getStorageClasses(3)},
      {id: 'oss-ap-south-1', label: '亚太南部(孟买)', storageClasses: getStorageClasses(3)},

      {id: 'oss-us-west-1', label: '美国西部1(硅谷)', storageClasses: getStorageClasses(3)},
      {id: 'oss-us-east-1', label: '美国东部1(弗吉尼亚)',storageClasses: getStorageClasses(3)},
      {id: 'oss-eu-central-1', label: '欧洲中部1(法兰克福)',storageClasses: getStorageClasses(3)},
      {id: 'oss-me-east-1', label: '中东东部1(迪拜)',storageClasses: getStorageClasses(3)},
    ],

    countryNum: [
      {"label":"中国大陆(+86)","value":"86"},
      {"label":"香港(+852)","value":"852"},
      {"label":"澳门(+853)","value":"853"},
      {"label":"台湾(+886)","value":"886"},
      {"label":"韩国(+82)","value":"82"},
      {"label":"日本(+81)","value":"81"},
      {"label":"美国(+1)","value":"1"},
      {"label":"加拿大(+1)","value":"1"},
      {"label":"英国(+44)","value":"44"},
      {"label":"澳大利亚(+61)","value":"61"},
      {"label":"新加坡(+65)","value":"65"},
      {"label":"马来西亚(+60)","value":"60"},
      {"label":"泰国(+66)","value":"66"},
      {"label":"越南(+84)","value":"84"},
      {"label":"菲律宾(+63)","value":"63"},
      {"label":"印度尼西亚(+62)","value":"62"},
      {"label":"德国(+49)","value":"49"},
      {"label":"意大利(+39)","value":"39"},
      {"label":"法国(+33)","value":"33"},
      {"label":"俄罗斯(+7)","value":"7"},
      {"label":"新西兰(+64)","value":"64"},
      {"label":"荷兰(+31)","value":"31"},
      {"label":"瑞典(+46)","value":"46"},
      {"label":"乌克兰(+380)","value":"380"}
    ]
  }
}])
;

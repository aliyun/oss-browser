# 授权码支持

主要支持2个功能:

1. 使用阿里云STS服务临时授权得到授权码。

2. 通过授权码登录OSS浏览器。

原理: https://help.aliyun.com/document_detail/31953.html

步骤: https://help.aliyun.com/knowledge_detail/39709.html


## 1. 授权码格式

```
var opt = {
  id: '',
  secret: '',
  stoken: '',
  privilege: '',
  expiration: '',
  osspath: ''
};

//toString
opt = JSON.stringify(opt);

//base64 encode
Buffer.from(opt, 'base64').toString();
```

具体可以参考代码: [app/main/files/modals/grant-token-modal.js](app/main/files/modals/grant-token-modal.js)

# 授权码支持

> [For English](en-authToken.md)

主要支持 2 种授权码:

1. 使用阿里云 STS 服务临时授权得到授权码, 通过授权码登录 OSS 浏览器。原理: https://help.aliyun.com/document_detail/31935.html

2. 将子账号 AK 等信息编码得到授权码, 通过授权码登录 OSS 浏览器。

## 1. 临时授权

### (1) 创建角色

请先按照这个文档创建角色: [STS 临时授权访问](https://help.aliyun.com/document_detail/31935.html)。

### (2) OSS 浏览器生成授权码

- 不能使用主账号 AK 登录，要用子账号登录。

- 该子账号要被授予 "AliyunSTSAssumeRoleAccess" 和 "AliyunRAMReadOnlyAccess" 权限，还要有*要授权目录*的访问权限。

子账号授权(初级用户推荐配置)：

![](../preview/genToken1.png)

使用 OSS 浏览器授权：

![](../preview/genToken2.png)

![](../preview/genToken3.png)

### (3) 授权码登录:

![](../preview/token-login.png)

### (4) 授权码格式说明

如果您使用程序生成授权码, 请按照以下格式生成：

```javascript
var opt = {
  id: "",
  secret: "",
  stoken: "",
  privilege: "",
  expiration: "",
  osspath: "",
  region: "",
};

//toString
opt = JSON.stringify(opt);

//base64 encode
Buffer.from(opt).toString("base64");
```

具体可以参考代码: [app/main/files/modals/grant-token-modal.js](app/main/files/modals/grant-token-modal.js)

## 2. 子账号 AK 编码

```javascript
var opt = {
  id: "",
  secret: "",
  desc: "", //可选
  region: "oss-cn-shenzhen",
  osspath: "oss://your-bucket/test/",
  eptpl: "http://{region}.aliyuncs.com",
};

//toString
opt = JSON.stringify(opt);

//base64 encode
Buffer.from(opt).toString("base64");
```

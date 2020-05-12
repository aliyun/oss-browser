# 邮件发送设置

> [For English](en-smtpSetting.md)

## 举例参考:

**_应用场景：1.简化 Policy 授权;2.对文件生成授权码;3.对文件生成下载链接;这三种情况时提供发送邮件功能_**

#### 1. QQ 邮箱:

`Note`: 针对使用 QQ 登录过程中出现的`535`错误，需要用户登录 QQ 邮箱设置页面开启 smtp 服务并设置授权码，记住发送邮箱的密码不是注册时的密码，而是授权码

```
"host": "smtp.qq.com",
"port": 465,
"secure": true
```

#### 2. Gmail:

```
"host": "smtp.gmail.com",
"port": 465,
"secure": true
```

#### 3. 126

```
"host": "smtp.126.com",
"port": 465,
"secure": true
```

#### 4. 163

```
"host": "smtp.163.com",
"port": 465,
"secure": true
```

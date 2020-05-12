# AK 登录

> [For English](en-aklogin.md)

### 1. 大权限子账号 AK 登录

- 不推荐使用主账号 AK 登录。推荐大权限子账号。

- 请到[RAM 控制台](https://ram.console.aliyun.com) 创建子账号 AK。

- 该子账号要被授予 "AliyunSTSAssumeRoleAccess" 和 "AliyunRAMReadOnlyAccess" 权限，还要有*要授权目录*的访问权限。

- 大权限子账号授权(初级用户推荐配置)：

![](../preview/genToken1.png)

#### (1) 公共云登录样例:

![](../preview/login.png)

#### (2) 专有云登录样例:

![](../preview/login2.png)

### 2. 小权限子账号登录:

假设子用户被授予权限 `oss://aabbcc4/dd/` 目录的读或者写权限, 这样的子用户姑且称之为小权限子用户，应该这样登录：

![](../preview/login-subak1.png)

也可以这样:

![](../preview/login-subak2.png)

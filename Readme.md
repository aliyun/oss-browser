
# OSS Browser

OSS Browser 提供类似windows资源管理器功能。用户可以很方便的浏览文件，上传下载文件，支持断点续传等。

本工具使用开源框架 Angular 1.x + [Electron](http://electron.atom.io/)制作。

> Electron 框架可以让你使用 JavaScript，HTML 和 CSS 构建跨平台的桌面应用程序。它是基于node.js 和 Chromium 开源项目。Electron 可以打包出跨平台的程序，运行在 Mac，Windows 和 Linux 上。


## 1. 客户端下载：

最新版本`1.6.2`，下载地址如下，解压即可使用。

> [<h4>Window x32版下载</h4>](https://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/1.6.2/oss-browser-win32-ia32.zip)


> [<h4>Window x64版下载</h4>](https://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/1.6.2/oss-browser-win32-x64.zip)


> [<h4>Mac zip版下载</h4>](https://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/1.6.2/oss-browser-darwin-x64.zip)


> [<h4>Ubuntu x64版</h4>](https://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/1.6.2/oss-browser-linux-x64.zip)

> [<h4>Ubuntu x32版</h4>](https://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/1.6.2/oss-browser-linux-ia32.zip)


其他版本暂不提供，可以自行build。


> [所有版本下载](all-releases.md)


## 2. 功能介绍:

```
功能Map
  |-- 登录：支持AK登录和授权码登录。
  |-- Bucket管理，新建bucket，删除bucket，bucket权限修改，碎片管理。
       |-- 文件管理：目录（包括bucket）和文件的增删改查， 复制, 文件预览等。
             |-- 文件传输任务管理： 上传下载，断点续传。
  |-- 地址栏功能（支持oss://协议URL，浏览历史前进后退，保存书签）
  |-- 授权功能： 简化RAM Policy授权。
  |-- 生成授权码： STS临时授权。
```


### (1) [AK登录](docs/aklogin.md)

![AK登录](preview/login.png)

* 子用户登录可以指定预设OSS路径，配合子用户授权使用。


### (2) Bucket列表

![Bucket列表](preview/bucket-list.png)


### (3) 文件列表 (支持拖拽上传)

![文件列表](preview/file-list.png)

### (4) [授权给子用户 & 子用户登录](docs/aklogin.md)

![授权给子用户](preview/subuser-grant.png)

![子用户登录](preview/login-subak1.png)

### (5) [临时授权 & 授权码登录](docs/authToken.md)

![临时授权](preview/genToken2.png)

![临时授权2](preview/genToken3.png)

![授权码登录](preview/token-login.png)

### (6) 归档bucket支持

![新建归档bucket](preview/create-archive-bucket.png)

![restore](preview/need-restore.png)

* 归档bucket下所有文件均为Archive存储类型, 需要恢复才能访问。


## 3. 开发环境搭建

> 如果你要在此基础上开发，请按照以下步骤进行。


### (1) 安装 node.js 最新版本

官网: https://nodejs.org/

### (2) 安装cnpm

官网: https://cnpmjs.org/

cnpm 是 npm（node 包管理工具）的中国镜像，可以提高下载依赖包的效率。

### (3) 如果使用 windows 系统，需要安装下列软件：

* 需要安装gitbash:

请自行下载安装。

* 需要安装 windows-build-tools:

```
cnpm i -g windows-build-tools
```

* 还需要下载make.exe，放到 `C:\windows\` 目录下

[make.exe(64位版本)](http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/windows-tools/64/make.exe)

[make.exe(32位版本)](http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/windows-tools/32/make.exe)



### (4) 下载代码

```
git clone git@github.com:aliyun/oss-browser.git
```

安装依赖:

```
make i
```


### (5) 运行

```
make run  # 开发模式运行, command+option+i 可用打开调试界面, win或linux按 F12.
```

开发模式下，会自动监听源码,如有修改,会自动build 前端代码到dist目录。


### (6) 打包

```
make build  # build前端代码到dist目录
```

```
make win64  # 打包win64程序， 可选: mac, linux64,linux32,win32,win64,all.
```



## 4. 代码结构


```
oss-browser/
 |-- app/                 # 前端代码, 采用angular1.x + bootstrap3.x
 |-- custom/              # 自定义图标，名称等。请看custom/Readme.md
 |-- node/                # 前端调用的 node 模块
     |-- crc64/           # crc校验模块，用来校验文件完整性
     |-- ossstore/        # 上传下载job类
     |-- i18n/            # 国际化
 |-- vendor/              # 前端 aliyun-sdk 依赖
 |-- node_modules         # node端依赖的模块
 |-- dist                 # 前端临时build出的代码
 |-- build                # electron build 出的应用
 |-- gulpfile.js          # 项目管理文件
 |-- package.json         # 项目描述文件
 |-- main.js              # 程序入口
```

## 5. 自定义build

请看这里: [自定义build](custom/)

## 6. 关于贡献

* 暂不接受代码贡献，如有建议或发现bug，请直接开issue。

## 7. 开源 LICENSE

[Apache License 2.0](LICENSE)

# OSS Browser

OSS Browser 提供类似windows资源管理器功能。用户可以很方便的浏览文件，上传下载文件，支持断点续传等。


本工具使用开源框架 Angular 1.x + [Electron](http://electron.atom.io/)制作。

> Electron 框架可以让你使用 JavaScript，HTML 和 CSS 构建跨平台的桌面应用程序。它是基于node.js 和 Chromium 开源项目。Electron 可以打包出跨平台的程序，运行在 Mac，Windows 和 Linux 上。


## 1. 客户端下载：

这是打包好的，下载地址如下，解压即可使用。

> [Window x64版下载](http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/0.5.0/oss-browser-win32-x64.zip)

> [Mac 版下载](http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/0.5.0/oss-browser-darwin-x64.zip)

> Linux版暂不提供，可以自行build。

### (1) AK登录

![](preview/login.png)


### (2) Bucket列表

![](preview/bucket-list.png)


### (3) 文件列表 (支持拖拽上传)

![](preview/file-list.png)



## 2. 开发环境搭建

> 如果你要在此基础上开发，请按照以下步骤进行。


### (1) 安装 node.js 最新版本

官网: https://nodejs.org/

### (2) 安装cnpm

官网: https://cnpmjs.org/

cnpm 是 npm（node 包管理工具）的中国镜像，可以提高下载依赖包的效率。


### (3) 下载代码

```
git clone git@github.com:aliyun/oss-browser.git
```

安装依赖(请使用cnpm):

```
cnpm i
```


### (4) 运行

```
npm run dev  # 开发模式运行, command+option+i 可用打开调试界面, win或linux按 F12.
```

开发模式下，会自动监听源码,如有修改,会自动build 前端代码到dist目录。


### (5) 打包

```
npm run build  # build前端代码到dist目录
```

```
npm run win64  # 打包win64程序， 可选: win32, mac, linux32, linux64
```


## 3. 功能介绍

```
功能Map
  |-- 登录：只需配置AK。
  |-- Bucket管理，新建bucket，删除bucket，bucket权限修改，碎片管理。
       |-- 文件管理：目录（包括bucket）和文件的增删改查， 复制, 文件预览等。
             |-- 文件传输任务管理： 上传下载，断点续传。
  |-- 地址栏功能（支持oss://协议URL，浏览历史前进后退，保存书签）
  |-- 授权功能： 简化RAM授权。
```

特色功能：

1. 地址栏功能：支持oss://协议URL，浏览历史前进后退，保存书签。

2. 预览和编辑功能：图片可以预览，文本直接可以编辑。

## 4. 代码结构


```
oss-browser/
 |-- app/                 # 前端代码, 采用angular框架
 |-- mock_server/         # mock 的web服务
 |-- node/                # 前端调用的 node 模块
     |-- ossstore/        # 上传下载job类
 |-- vendor/              # 前端 aliyun-sdk 依赖
 |-- bower_components/    # 前端依赖的模块
 |-- node_modules         # node端依赖的模块
 |-- dist                 # 前端临时build出的代码
 |-- build                # node-webkit build出的应用
 |-- cache                # node-webkit 的下载缓存
 |-- gulpfile.js          # 项目管理文件
 |-- package.json         # 项目描述文件
```


## 5. TODO

* 自动更新
* 图片预览放大缩小。
* RAM授权
* 错误堆栈
* 优化批量删除
* 跨区域复制

## 6. 关于贡献

* 暂不接受代码贡献，如有建议或发现bug，请直接开issue。

## 7. 开源 LICENSE

[Apache License 2.0](LICENSE)

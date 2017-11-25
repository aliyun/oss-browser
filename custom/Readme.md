# 定制 OSS Browser

通过修改此目录下的配置，目前可以较容易的自定义logo，app名称，版本号，更新地址等。

如果需要修改更多内容，请直接修改oss browser代码。

下面介绍如何修改配置，如何重新build，如何发布。

* build oss browser 推荐使用 Mac，其次 ubuntu，再其次 windows。

## 1. 安装环境

本工具使用 [Electron](https://electron.atom.io/) 编写，依赖 [Node.js](https://nodejs.org) >= 7.9.0.

所以先要安装 Node.js

### (1) Node.js

Node.js 从官网下载最新版本安装即可。

### (2) 安装 cnpm（npm的中国镜像，加快依赖下载速度）。

```
sudo npm install -g cnpm --registry=https://registry.npm.taobao.org
```

### (3) 获取 oss-browser 源码

先到 https://github.com/aliyun/oss-browser ，Fork 一份到你自己的仓库，然后clone：

```
git clone {git地址}
cd oss-browser
```

### (4) 如果使用 windows 系统，需要安装下列软件：

* 需要安装gitbash:

请自行下载安装。

* 需要安装 windows-build-tools:

```
cnpm i -g windows-build-tools
```

* 还需要下载make.exe，放到 `C:\windows\` 目录下

[make.exe(64位版本)](http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/windows-tools/64/make.exe)

[make.exe(32位版本)](http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/windows-tools/32/make.exe)



## 2. 开始尝试启动

```
make i   # 安装 node 模块依赖
make build  # 生成dist目录
```

启动界面：
```
make run # 开发模式启动
```

这时，你可以看到界面了（开发模式，可以按 command+r 刷新)。


## 3. 自定义 custom 配置

```
oss-browser/
  |-- custom
```

将 custom 目录复制一份到其他地方，比如 ~/Desktop/custom/,
修改目录下的 index.js 配置 和 图标即可。

Makefile有3个变量，可以替换,分别为：NAME,CUSTOM,VERSION.

* 假设你的应用名为: my-oss-browser
* 假设你的custom目录为: ~/Desktop/custom/

然后指定custom路径 build:
```
make build NAME=my-oss-browser CUSTOM=~/Desktop/custom/
```

开发模式启动：
```
make run NAME=my-oss-browser CUSTOM=~/Desktop/custom/
```


## 4. build


```
make all NAME=my-oss-browser CUSTOM=~/Desktop/custom/
```

* Makefile中的 VERSION 和 NAME 变量，VERSION 需要和 custom/index.js 中的version相同，NAME需要和appId相同。
* 可以指定 NAME,CUSTOM 和 VERSION 变量.
* 除了会在 build 下生成几个目录，还会在 releases 目录下，生成几个压缩包(绿色免安装版)。



### (可选) mac平台相关的安装文件

```
make dmg NAME=oss-browser # 只能在mac系统下build，生成 releases/${VERSION}/oss-browser.dmg 文件
```
* 此命令需要在 make mac 或者 make all 命令后执行。
* 可以指定 NAME, CUSTOM 和 VERSION 变量。



## 5. 发布(可选)

custom/index.js中的这2个变量如果不配置，则build出来的应用没有自动检测升级功能：
```
//release notes目录后缀，里面有 ${version}.md, 如 1.0.0.md
release_notes_url: 'https://raw.githubusercontent.com/aliyun/oss-browser/master/release-notes/',

//升级检测链接
upgrade_url: "https://raw.githubusercontent.com/aliyun/oss-browser/master/upgrade.json",
```


### 如何配置:

我们可以将安装包上传到oss的某个目录下（如：oss-browser-publish），将这个目录设置为公共读。

> 升级检测原理:

custom/index.js 的 upgrade_url 配置 upgrade.json 的 https 地址, 客户端启动后会请求这个链接进行升级检测。

upgrade.json 样例:

```json
{
  "version": "1.3.0",
  "package_url": "http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/"
}
```

* version 表示可升级的最新版本，如果这个版本比本地客户端的版本大，则可以升级。

* package_url：安装包下载地址前缀。可以修改根据实际情况修改。


oss-browser-publish 目录结构:
```
.../oss-browser-publish/
      |-- 1.3.0
            |-- oss-browser-linux-x64.zip    # linux 64位
            |-- oss-browser-win32-ia32.zip   # windows 32位
            |-- oss-browser-win32-x64.zip    # windows 64位
            |-- oss-browser-darwin-x64.zip   # mac 64位
            |-- oss-browser.dmg         # 如果在mac下build过： make dmg
      |-- 1.2.5
      |-- ...
```


将build好的安装包，上传到 oss-browser-publish 的版本目录下。

文件上传完成后，修改upgrade.json中的version，旧版本的客户端即可查询到有版本更新。


> release note 更新

在 ./release-notes/ 目录下对于的版本号文件，请使用markdown编写release notes。

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


## 2. 开始尝试启动

```
cnpm i   # 安装 node 模块依赖
```

启动界面：
```
npm run dev # 开发模式启动
```

这时，你可以看到界面了（开发模式，可以按 command+r 刷新)。


## 3. 修改 custom 配置

```
oss-browser/
  |-- custom
```

修改 custom 中的 index.js 配置 和 图标即可。

## 4. build


```
npm run all
```
会在 build 下生成几个文件夹。即是安装文件。你可以手动zip一下，再发布。


* 如果是在 mac 下，请运行： 

```
make all 
```
除了会在 build 下生成几个目录，

还会在 releases 目录下，生成几个压缩包。这几个压缩包即安装文件。



## 5. 发布

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
      |-- 1.2.5
      |-- ...
```


将build好的安装包，上传到 oss-browser-publish 的版本目录下。

文件上传完成后，修改upgrade.json中的version，旧版本的客户端即可查询到有版本更新。

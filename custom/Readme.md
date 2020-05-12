# 定制 OSS Browser

通过修改此目录下的配置，目前可以较容易的自定义 logo，app 名称，版本号，更新地址等。

如果需要修改更多内容，请直接修改 oss browser 代码。

下面介绍如何修改配置，如何重新 build，如何发布。

- build oss browser 推荐使用 Mac，其次 ubuntu，再其次 windows。

## 1. 安装环境

本工具使用 [Electron](https://electron.atom.io/) 编写，依赖 [Node.js](https://nodejs.org) >= 7.9.0.

所以先要安装 Node.js

### (1) Node.js

Node.js 从官网下载最新版本安装即可。

### (2) 安装 cnpm（npm 的中国镜像，加快依赖下载速度）。

```
sudo npm install -g cnpm --registry=https://registry.npm.taobao.org
```

### (3) 获取 oss-browser 源码

先到 https://github.com/aliyun/oss-browser ，Fork 一份到你自己的仓库，然后 clone：

```
git clone {git地址}
cd oss-browser
```

### (4) 使用 mac 平台来 build。

需要使用 brew 来安装 wine:

```
brew install wine
```

### (5) 如果使用 windows 系统(不推荐)，需要安装下列软件：

- 需要安装 gitbash:

请自行下载安装。

- 需要安装 windows-build-tools:

```
cnpm i -g windows-build-tools
```

- 还需要下载 make.exe，放到 `C:\windows\` 目录下

[make.exe(64 位版本)](http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/windows-tools/64/make.exe)

[make.exe(32 位版本)](http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/windows-tools/32/make.exe)

- 可以还会遇到其他问题，请自行解决。

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

Makefile 有 3 个变量，可以替换,分别为：NAME,CUSTOM,VERSION.

- 假设你的应用名为: my-oss-browser
- 假设你的 custom 目录为: ~/Desktop/custom/

然后指定 custom 路径 build:

```
make build NAME=my-oss-browser CUSTOM=~/Desktop/custom
```

开发模式启动：

```
make run NAME=my-oss-browser CUSTOM=~/Desktop/custom
```

## 4. build

```
make all NAME=my-oss-browser CUSTOM=~/Desktop/custom
```

- Makefile 中的 VERSION 和 NAME 变量，VERSION 需要和 custom/index.js 中的 version 相同，NAME 需要和 appId 相同。
- 可以指定 NAME,CUSTOM 和 VERSION 变量.
- 除了会在 build 下生成几个目录，还会在 releases 目录下，生成几个压缩包(绿色免安装版)。

### (可选) mac 平台相关的安装文件

```
make dmg NAME=my-oss-browser # 只能在mac系统下build，生成 releases/${VERSION}/my-oss-browser.dmg 文件
```

- 此命令需要在 make mac 或者 make all 命令后执行。
- 可以指定 NAME, CUSTOM 和 VERSION 变量。

## 5. 自动更新

后续的 bug fix，功能更新，都是自动的。无需关心。

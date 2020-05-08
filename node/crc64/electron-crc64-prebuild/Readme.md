# electron-crc64-prebuild

crc64 模块， 供 Electron 1.6.5 版本调用。

## 1. 支持以下版本:

electron=1.6.5

```
darwin-x64 (mac x64)
linux-x64 (linux x64)
linux-ia32 (linux ia32)
win32-x64 (windows x64)
win32-ia32 (windows ia32)
```

其他版本请自己 build.

## 2. 如果想自己 build

https://electronjs.org/docs/tutorial/using-native-node-modules

### (1) 安装 node.js

### (2) 配置 npm

```
npm config set registry https://registry.npm.taobao.org
```

### (3) 安装 build 工具

请先安装：node-gyp https://github.com/nodejs/node-gyp#installation

windows 下还需安装:

```
npm i -g windows-build-tools
```

### (4) build

```
npm i
npm run build
```

## 2. 测试

```
npm test
```

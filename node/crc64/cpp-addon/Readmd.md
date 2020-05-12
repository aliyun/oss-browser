# crc64 prebuild module

请先安装：node-gyp https://github.com/nodejs/node-gyp#installation

## 1. 仅支持以下版本:

```
darwin-x64 (mac x64)
linux-x64 (linux x64)
win32-x64 (windows x64)
```

- 其他版本可以自行 build:

```
cnpm i
npm run build
```

## 2. 测试

```
npm test   # mac & linux

npm testInWin # for windows
```

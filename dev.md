## 1. TODO

- 图片预览放大缩小。
- 错误堆栈
- 跨区域复制

## 2. 自动升级策略

upgrade.json 配置

```
{
  "version": "1.5.0",
  "package_url": "http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/",
  "files": ["app.asar","electron.asar"]
}
```

- 客户端启动后，获取远程的 upgrade.json。
- 如果有 files 字段，则根据当前操作系统环境，下载 files 字段对应的文件。下载完成后，提示重启客户端。
- 如果没有 files 字段，表示安装包更新，提示下载更新。

### (1) 字段说明:

|字段| 是否必选| 说明|
|version|是| 最新版本号 |
|package_url| 是| 安装包所在路径前缀 |
|files|否| 如果配置，则只更新改字段配置的文件。如果不配置，表示全包下载。可选项: app.asar, electron.asar 或者不配置 |

### (2) 安装包在 OSS 中的目录结构:

package_url: http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/

```
oss-browser-publish
  |-- 1.5.0
    |-- oss-browser-darwin-x64.zip
    |-- oss-browser-linux-x64.zip
    |-- oss-browser-linux-ia32.zip
    |-- oss-browser-win32-x64.zip
    |-- oss-browser-win32-ia32.zip
    |-- darwin-x64
        |-- app.asar
        |-- electron.asar
    |-- linux-x64
        |-- app.asar
        |-- electron.asar
    |-- linux-ia32
        |-- app.asar
        |-- electron.asar
    |-- win32-x64
        |-- app.asar
        |-- electron.asar
    |-- win32-ia32
        |-- app.asar
        |-- electron.asar
```

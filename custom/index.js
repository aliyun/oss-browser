const path = require('path');
const pkg = require('../package.json');

module.exports= {
  //窗体title
  title: 'OSS Browser',

  //app id，打包名称前缀
  appId: 'oss-browser',

  //app名称，需要提供各个语言版本
  appName: {
    'zh-CN':'OSS浏览器',
    'en-US': 'OSS Browser',
  },

  //自定义版本号，如果不设置，使用package.json中的version
  version: pkg.version,


  //logo png 格式, 主要用于mac和linux系统
  logo_png: path.join(__dirname, './logo.png'),

  //logo icns 格式，主要用于mac系统
  logo_ico: path.join(__dirname, './logo.icns'),

  //logo ico 格式，主要用于windows系统
  logo_ico: path.join(__dirname, './logo.ico'),


  //release notes目录后缀，里面有 ${version}.md, 如 1.0.0.md
  release_notes_url: 'https://raw.githubusercontent.com/aliyun/oss-browser/master/release-notes/',

  //升级检测链接
  upgrade_url: "https://raw.githubusercontent.com/aliyun/oss-browser/master/upgrade.json",

  //“关于”弹窗的主要内容
  //about_html: '<div>开源地址:</div>',

};

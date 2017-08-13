const fs = require('fs');
const path = require('path');

var t=[`||Windows x64| Mac |Linux x64|
  |-----|-----|---------|--------|`];

var vs = [];
var arr = fs.readdirSync('./release-notes');
arr.forEach(n=>{
  var version = n.substring(0, n.length - path.extname(n).length );
  vs.push(version);
});

//sort by version
vs.sort(compareVersion);

vs.forEach(version=>{
  var str = `|${version}|[下载](http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/${version}/oss-browser-win32-x64.zip) | [下载](http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/${version}/oss-browser.dmg) | [下载](http://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/${version}/oss-browser-linux-x64.zip) |`;
 t.push(str);
});

fs.writeFileSync('./old-releases.md', t.join('\n'));

function compareVersion(a,b){
  var v1 = a.split('.');
  var v2 = b.split('.');
  for(var i=0;i<v1.length;i++){ 
     if(parseInt(v1[i]) < parseInt(v2[i])) return 1;
     else if(parseInt(v1[i]) > parseInt(v2[i])) return -1;
  }
  return -1;
}

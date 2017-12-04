const fs = require('fs');
const path = require('path');

var ia32_start_version= '1.2.5';
var dmg_end_version= '1.4.0';
const PRE  = 'https://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/';

var t=[`All Releases for [ OSS Browser ]

  ||Windows ia32|Windows x64| Mac |Linux ia32|Linux x64|
  |-----|-----|-----|---------|--------|--------|`];

var vs = [];
var arr = fs.readdirSync('./release-notes');
arr.forEach(n=>{
  var version = n.substring(0, n.length - path.extname(n).length );
  vs.push(version);
});

//sort by version
vs.sort(compareVersion);

vs.forEach(version=>{
  if(compareVersion(version, dmg_end_version) <= 0){
    var str = `|${version}|[Download](${PRE}${version}/oss-browser-win32-ia32.zip) |[Download](${PRE}${version}/oss-browser-win32-x64.zip) | [Download](${PRE}${version}/oss-browser-darwin-x64.zip) | [Download](${PRE}${version}/oss-browser-linux-ia32.zip) | [Download](${PRE}${version}/oss-browser-linux-x64.zip)|`;
  }
  else if(compareVersion(version, ia32_start_version)<0){
    var str = `|${version}|[Download](${PRE}${version}/oss-browser-win32-ia32.zip) |[Download](${PRE}${version}/oss-browser-win32-x64.zip) | [Download](${PRE}${version}/oss-browser.dmg) | | [Download](${PRE}${version}/oss-browser-linux-x64.zip) |`;
  }
  else{
    var str = `|${version}||[Download](${PRE}${version}/oss-browser-win32-x64.zip) | [Download](${PRE}${version}/oss-browser.dmg) | | [Download](${PRE}${version}/oss-browser-linux-x64.zip) |`;
  }
 t.push(str);
});

fs.writeFileSync('./all-releases.md', t.join('\n'));

function compareVersion(a,b){
  var v1 = a.split('.');
  var v2 = b.split('.');
  for(var i=0;i<v1.length;i++){
     if(parseInt(v1[i]) < parseInt(v2[i])) return 1;
     else if(parseInt(v1[i]) > parseInt(v2[i])) return -1;
  }
  return -1;
}

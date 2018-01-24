const fs = require('fs');
const path = require('path');

var start_version = '1.5.0';

const PRES = [
  {title: 'China(Hangzhou)', url: 'https://luogc.oss-cn-hangzhou.aliyuncs.com/oss-browser-publish/'},
  {title: 'Hongkong', url: 'https://client-publish-hongkong.oss-cn-hongkong.aliyuncs.com/oss-browser-publish/'},
  {title: 'Eastern US', url: 'https://client-publish-useast1.oss-us-east-1.aliyuncs.com/oss-browser-publish/'},
]

var t = [`# All Releases for [ OSS Browser ]\n`];


var vs = [];
var arr = fs.readdirSync('./release-notes');
arr.forEach(n => {
  var version = n.substring(0, n.length - path.extname(n).length);
  if(compareVersion(version, start_version)<=0)
  vs.push(version);
});

//sort by version
vs.sort(compareVersion);

PRES.forEach(n=>{
  t.push(`## Download from ${n.title}\n`)

  t.push(`||Windows ia32|Windows x64| Mac(zip) |Linux ia32|Linux x64|Release note|
  |-----|-----|-----|-----|--------|--------|---|`)
  vs.forEach(version => {
    var str = `|${version}|[Download](${n.url}${version}/oss-browser-win32-ia32.zip) |[Download](${n.url}${version}/oss-browser-win32-x64.zip) |  [Download](${n.url}${version}/oss-browser-darwin-x64.zip) | [Download](${n.url}${version}/oss-browser-linux-ia32.zip) | [Download](${n.url}${version}/oss-browser-linux-x64.zip)|`;
    str += '[' + version + '.md](release-notes/' + version + '.md)|'
    t.push(str);
  });
  t.push('')
})


t.push('')
t.push('[Earlier Releases](earlier-releases.md)')

fs.writeFileSync('./all-releases.md', t.join('\n'));

function compareVersion(a, b) {
  var v1 = a.split('.');
  var v2 = b.split('.');
  for (var i = 0; i < v1.length; i++) {
    if (parseInt(v1[i]) < parseInt(v2[i])) return 1;
    else if (parseInt(v1[i]) > parseInt(v2[i])) return -1;
  }
  return -1;
}

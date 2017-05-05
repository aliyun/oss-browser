'use strict';

angular.module('web')
  .filter('hideSecret', function(){
    return function(s){
      if(s.length < 6) return '******';
      else return s.substring(0,3)+'****'+s.substring(s.length-3);
    };
  })
  .filter('timeFormat', function () {
    return function (d, de) {
      de = de || '';
      try {
        if(!d)return de;
        var s = new Date(d);
        if (s == 'Invalid date') {
          return de;
        }
        return moment(s).format('YYYY-MM-DD HH:mm:ss');
      }
      catch(e){
        return de;
      }

    };
  })
  .filter('elapse', function(){
    return function(st, et){
      et = et || new Date().getTime();

      var ms = et - st;

      if(isNaN(ms)){
        return '';
      }
      if(ms<=0)return 0;
      else if(ms < 1000) return ms+'ms';

      //return moment.duration(ms).humanize();

      var h = Math.floor(ms/3600/1000);
      if(h){
        ms = ms-h*3600*1000;
      }
      var m = Math.floor(ms/60/1000);
      if(m){
        ms = ms-m*60*1000;
      }
      var s = Math.floor(ms/1000);
      if(s){
        ms = ms-s*1000;
      }
      return h+':'+m+':'+s;

    };
  })
  .filter('leftTimeFormat', function(){
     return function(ms){
       if(isNaN(ms)){
         return '';
       }
       if(ms<=0)return 0;
       else if(ms < 1000) return ms+'ms';

       //return moment.duration(ms).humanize();
       var t=[];

       var d = Math.floor(ms/24/3600/1000);
       if(d){
         ms = ms-d*3600*1000*24;
         t.push(d+' 天');
       }
       var h = Math.floor(ms/3600/1000);
       if(h){
         ms = ms-h*3600*1000;
         t.push(h+' 小时');
       }
       var m = Math.floor(ms/60/1000);
       if(m){
         ms = ms-m*60*1000;
         t.push(m+' 分');
       }
       var s = Math.floor(ms/1000);
       if(s){
         ms = ms-s*1000;
         t.push(s+' 秒');
       }
       //
       //if(ms){
       //  t.push(ms+'ms');
       //}
       return t.join(' ');
     };
  })
  .filter('sizeFormat', function () {

    return function (n, ex) {
      if (n == 0)return 0;
      if(!n)return '';

      var t = [];
      var left = n;
      var gb = Math.floor(n / Math.pow(1024, 3));
      if (gb > 0) {
        if (ex) {
          t.push(gb + 'G');
          left = left % Math.pow(1024, 3);
        }
        else {
          return Math.round(n * 100 / Math.pow(1024, 3)) / 100 + 'GB';
        }
      }

      var mb = Math.floor(left / Math.pow(1024, 2));
      if (mb > 0) {
        if (ex) {
          t.push(mb + 'M');
          left = left % Math.pow(1024, 2);
        } else {
          return Math.round(100 * left / Math.pow(1024, 2)) / 100 + 'MB';
        }
      }

      var kb = Math.floor(left / 1024);
      if (kb > 0) {
        if (ex) {
          t.push(kb + 'K');
          left = left % 1024;
        } else {
          return Math.round(100 * left / 1024) / 100 + 'KB';
        }
      }

      if (left > 0) {
        t.push(left + 'B');
        if (!ex) return left + 'B';
      }
      return t.length>0?t.join(''):0;
    };

  })
.filter('persent', function(){
  return function(a, b, status){

    if(a==0 && b==0){
      if(status=='finished'){return 100;}
      else return 0;
    }
    return Math.floor(a/b*10000)/100;
  };
})
.filter('statusCls', function(){
  return function(s){
    if(!s)return 'default';
    switch(s.toLowerCase()){
      case 'running': return 'info';
      case 'failed': return 'danger';
      case 'finished': return 'success';
      case 'stopped': return 'warning';
      default : return 'default';
    }
  };
}).filter('status', function(){
  return function(s, isUp){
    if(!s)return s;
    switch(s.toLowerCase()){
      case 'running': return isUp? '正在上传':'正在下载';
      case 'failed': return '失败';
      case 'finished': return '完成';
      case 'stopped': return '停止';
      default : return '等待';
    }
  };
})
.filter('fileIcon', ['fileSvs', function(fileSvs){
  return function(item){
    if(item.storageClass=='Archive'){
      //restore
      if(item.storageStatus==2){
        return 'hourglass-2 text-warning';
      }else if(item.storageStatus!=3){
         return 'square';
      }
    }
    var info = fileSvs.getFileType(item);

    if(info.type=='picture') return 'file-image-o';
    if(info.type=='doc'){
      switch(info.ext[0]){
        case 'doc':
        case 'docx': return 'file-word-o';
        case 'pdf': return 'file-pdf-o';
        case 'ppt':
        case 'pptx': return 'file-powerpoint-o';
        case 'exl': return 'file-excel-o';
      }
      return 'file-o';
    }
    if(info.type=='code'){
      return 'file-text-o';
    }
    if(info.type=='others'){
      switch(info.ext[0]){
        case 'gz':
        case 'tar':
        case 'zip':
        case 'jar':
        case 'bz':
        case 'war':
        case 'xz': return 'file-zip-o';

        case 'pkg': return 'dropbox';
        case 'app':
        case 'dmg': return 'apple';
        case 'apk': return 'android';

        case 'msi':
        case 'deb':
        case 'bin':

        case 'exe': return 'cog';

        case 'img':
        case 'iso': return 'dot-circle-o';

        case 'cmd':
        case 'sh': return 'terminal';
      }
      return 'file-o';
    }
    else return 'file-o';
  };
}])
;

angular.module('web')
  .factory('jobUtil', ['$q', '$state', '$timeout',
   function ($q, $state, $timeout) {

      return {
        getStatusLabel: getStatusLabel,
        getStatusCls: getStatusCls
      };
      function getStatusCls(s){
        if(!s)return 'default';
        switch(s.toLowerCase()){
          case 'running': return 'info';
          case 'failed': return 'danger';
          case 'finished': return 'success';
          case 'stopped': return 'warning';
          default : return 'default';
        }
      }

      function getStatusLabel(s, isUp){
        if(!s)return s;
        switch(s.toLowerCase()){
          case 'running': return isUp? '正在上传':'正在下载';
          case 'failed': return '失败';
          case 'finished': return '完成';
          case 'stopped': return '暂停';
          default : return '等待';
        }
      }
   }
]);

angular.module('web').factory('utilSvs', [
  '$timeout',
  function ($timeout) {
    return {
      leftTime: leftTime,
      isArchiveRead: isArchiveRead,
    };

    function leftTime(ms) {
      if (isNaN(ms)) {
        return '';
      }

      if (ms <= 0) {
        return 0;
      }

      if (ms < 1000) {
        return ms + 'ms';
      }

      // return moment.duration(ms).humanize();
      var t = [];

      var d = Math.floor(ms / 24 / 3600 / 1000);

      if (d) {
        ms -= d * 3600 * 1000 * 24;
        t.push(d + 'D');
      }

      var h = Math.floor(ms / 3600 / 1000);

      if (h) {
        ms -= h * 3600 * 1000;
        t.push(h + 'h');
      }

      var m = Math.floor(ms / 60 / 1000);

      if (m) {
        ms -= m * 60 * 1000;
        t.push(m + 'm');
      }

      var s = Math.floor(ms / 1000);

      if (s) {
        ms -= s * 1000;
        t.push(s + 's');
      }

      //
      // if(ms){
      //  t.push(ms+'ms');
      // }
      return t.join(' ');
    }

    //文件是否处于可读状态
    function isArchiveRead(items) {
      for (const item of items) {
        if (
          ['Archive', 'ColdArchive', 'DeepColdArchive'].includes(item.storageClass) &&
          item.storageStatus !== 3
        ) {
          return false;
        }
      }
      return true;
    }
  },
]);

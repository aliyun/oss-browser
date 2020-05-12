angular.module("web").factory("utilSvs", [
  "$timeout",
  function ($timeout) {
    return {
      leftTime: leftTime,
    };

    function leftTime(ms) {
      if (isNaN(ms)) {
        return "";
      }
      if (ms <= 0) return 0;
      else if (ms < 1000) return ms + "ms";

      //return moment.duration(ms).humanize();
      var t = [];

      var d = Math.floor(ms / 24 / 3600 / 1000);
      if (d) {
        ms = ms - d * 3600 * 1000 * 24;
        t.push(d + "D");
      }
      var h = Math.floor(ms / 3600 / 1000);
      if (h) {
        ms = ms - h * 3600 * 1000;
        t.push(h + "h");
      }
      var m = Math.floor(ms / 60 / 1000);
      if (m) {
        ms = ms - m * 60 * 1000;
        t.push(m + "m");
      }
      var s = Math.floor(ms / 1000);
      if (s) {
        ms = ms - s * 1000;
        t.push(s + "s");
      }
      //
      //if(ms){
      //  t.push(ms+'ms');
      //}
      return t.join(" ");
    }
  },
]);

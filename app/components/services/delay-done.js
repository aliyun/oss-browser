angular.module("web").factory("DelayDone", [
  "$timeout",
  function ($timeout) {
    var mDelayCall = {};

    return {
      delayRun: delayRun,
      seriesRun: seriesRun,
    };

    /**
     * @param id {String}  uniq
     * @param timeout {int}  ms
     * @param times {int}  超过次数也会调, 然后重新统计
     * @param fn {Function}  callback
     */

    function delayRun(id, timeout, fn, times) {
      if (!mDelayCall[id])
        mDelayCall[id] = {
          tid: "",
          c: 0,
        };
      var n = mDelayCall[id];

      n.c++;

      if (n.c >= times) {
        fn();
        n.c = 0;
      } else {
        $timeout.cancel(n.tid);
        n.tid = $timeout(fn, timeout);
      }
    }

    function seriesRun(arr, fn, doneFn) {
      var len = arr.length;
      var c = 0;

      function _dig() {
        var n = arr[c];
        fn(n, function () {
          c++;
          if (c >= len) {
            doneFn();
          } else {
            $timeout(function () {
              _dig();
            }, 1);
          }
        });
      }
      _dig();
    }
  },
]);

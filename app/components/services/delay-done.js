angular.module('web')
  .factory('DelayDone', [ '$timeout',function($timeout ){

    var fnMap = {};

    return delayDone;

    function delayDone(id, timeout, fn){

      if(fnMap[id]){
        fnMap[id]=fn;
        return;
      }
      fnMap[id]=fn;

      $timeout(function(){

        if(typeof fnMap[id]=='function')fnMap[id]();
        fnMap[id]=false;

      },timeout);
    }

  }])
;
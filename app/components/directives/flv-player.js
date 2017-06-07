angular.module('web')
  .directive('flvPlayer', ['$timeout', function ($timeout) {

    return {
      link: linkFn, 
      restrict: 'EA',
      transclude: false,
      scope: {
        src: '=',
        preload: '=', //none auto
        autoplay: '='  //autoplay
      }
    };
   

    function linkFn(scope, ele, attr) {
 
      if (!flvjs.isSupported()) { 
        return;
      }
      

    
      var flvPlayer;
      

      scope.$watch('src', init);
     

      function init(){ 
        var src = scope.src;

        if(!src)return;


 
        var videoStr = '<video id="myFlvPlayer" style="height:100%;width:100%;min-height:100px;" controls></video>';
 
        ele.html(videoStr);
        //var playerEl = $('<video id="myFlvPlayer" src="'+src+'" style="height:100%;width:100%;min-height:100px;" controls></video>').appendTo(ele);
        var playerEl = $('#myFlvPlayer');
        

        //playerEl[0].src = src;

        if(flvPlayer) flv_destroy(); 

        var xhr = new XMLHttpRequest();
        console.log('xhr.get:',src.toString())
        xhr.open('GET', src, true);
        xhr.onload = function (e) {

          flvPlayer = flvjs.createPlayer({
            type: 'flv',
            cors: true,
            src: src.toString()
          });

          console.log(playerEl[0])  

          flvPlayer.attachMediaElement(playerEl[0]);
          flvPlayer.load();
          flvPlayer.play();

          if(scope.preload=='auto') flvPlayer.load();
          
          if(scope.autoplay!=null) flvPlayer.play();
        };
        xhr.send();
      }
      function flv_destroy() { 
            flvPlayer.pause();
            flvPlayer.unload();
            flvPlayer.detachMediaElement();
            flvPlayer.destroy();
            flvPlayer = null;
        }
 
    }

  }]);
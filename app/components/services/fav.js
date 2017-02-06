
angular.module('web')
  .factory('Fav', ['$q', function($q){

    var MAX = 100;

    return {
      add: add,
      list: list,
      remove: remove,
      has: has,
    };
    function has(addr){
      var arr = list();
      for(var i=0;i<arr.length;i++){
        if(arr[i].url==addr){
           return true;
        }
      }
      return false;
    }

    function add(addr){
      var arr = list();

      if(arr.length>=MAX) return false;
      for(var i=0;i<arr.length;i++){
        if(arr[i].url==addr){
          arr.splice(i,1);
          i--;
        }
      }
      arr.push({url:addr,time:new Date().getTime()});
      if(arr.length>MAX){
        arr.splice(MAX,arr.length-MAX);
      }
      localStorage.setItem('favs',JSON.stringify(arr));
      return true;
    }

    function remove(addr){
      var arr = list();
      for(var i=0;i<arr.length;i++){
        if(arr[i].url==addr){
          arr.splice(i,1);
          i--;
        }
      }
      localStorage.setItem('favs',JSON.stringify(arr));
    }

    function list(){
      try{
        var arr = JSON.parse(localStorage.getItem('favs')||'[]');
        return arr;
      }catch(e){
        return [];
      }
    }



  }]);

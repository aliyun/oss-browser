angular.module('web')
.factory('settingsSvs', [function(){

  return {
    maxUploadJobCount: {
      get: function(){
        return parseInt(localStorage.getItem('maxUploadJobCount')||2);
      },
      set: function(v){
        return localStorage.setItem('maxUploadJobCount',v);
      }
    },

    maxDownloadJobCount: {
      get: function(){
        return parseInt(localStorage.getItem('maxDownloadJobCount')||2);
      },
      set: function(v){
        return localStorage.setItem('maxDownloadJobCount',v);
      }
    },

    historiesLength: {
      get: function(){
        return parseInt(localStorage.getItem('historiesLength')||100);
      },
      set: function(v){
        return localStorage.setItem('historiesLength',v);
      }
    }
  };
}]);


angular.module('web')
  .factory('fileSvs', ['$q', function($q){



    return {
      /**
      * 根据后缀判断
      * @param  item = {name, size}
      * @return obj = {type, ...}
      *     type: [picture|code|others|doc|video|audio]
      */
      getFileType: function(item){
         var ext = (item.name.indexOf('.')!=-1)
             ? item.name.substring(item.name.lastIndexOf('.')+1)
             : '';

         switch(ext){
           case 'png':
           case 'jpg':
           case 'jpeg':
           case 'gif': return {type: 'picture', ext: [ext]};

           case 'doc':
           case 'docx':
           case 'pdf': return {type: 'doc', ext: [ext]};

           case 'mp4': return {type:'video', ext: [ext], mineType: 'video/mp4'};
           case 'webm': return {type:'video', ext: [ext], mineType: 'video/webm'};
           case 'mov': return {type:'video', ext: [ext], mineType: 'video/quicktime'};
           //case 'flv': return {type:'video', ext: [ext], mineType: 'video/x-flv'};
           case 'ogv': return {type:'video', ext: [ext], mineType: 'video/ogg'};

           case 'mp3': return {type:'audio', ext: [ext], mineType: 'audio/mp3'};
           case 'ogg': return {type:'audio', ext: [ext], mineType: 'audio/ogg'};
         }

         var codeMode =  CodeMirror.findModeByExtension(ext);

         if(codeMode){
           codeMode.type='code';
           return codeMode;
         }
         else{
           return {type: 'others', ext: [ext]};
         }
      }
    };



  }]);

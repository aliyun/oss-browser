
angular.module('web')
  .factory('fileSvs', ['$q', function($q){



    return {
      /**
      * 根据后缀判断
      * @param  item = {name, size}
      * @return obj = {type, ...}
      *     type: [picture|code|others|doc]
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


/*
 <input type="text" ng-model="abc" cleanable-input x="-3" y="-5"/>
 */

angular.module('web')
  .directive('clipboardButton', ['Toast', function(Toast) {

    return {
      restrict: 'EA',
      scope: {
        action: '=',
        target: '=',
        success: '&'
      },
      link: function link(scope, ele) {

        var d = new Clipboard(ele[0], {
            text: function(){
              return $(scope.target).val();
            },
            action: scope.action || 'copy'
        });

        d.on('success',function(){
          Toast.success('复制成功');
        });

      }

    };

  }]);

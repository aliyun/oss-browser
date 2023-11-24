angular.module('web').controller('grantModalCtrlCode', [
  '$scope',
  '$sce',
  '$uibModalInstance',
  'items',
  function(
      $scope,
      $sce,
      $modalInstance,
      items
  ) {
    angular.extend($scope, {
      cancel: cancel,
      htm: $sce.trustAsHtml(items.html)
    });

    function cancel() {
      $modalInstance.dismiss('close');
    }
  }
]);

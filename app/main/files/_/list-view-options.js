angular.module("web").controller("listViewOptionsCtrl", [
  "$scope",
  function ($scope) {
    angular.extend($scope, {
      setListView: setListView,
    });

    $scope.ref.isListView = getListView();

    function getListView() {
      return localStorage.getItem("is-list-view") == "false" ? false : true;
    }
    function setListView(f) {
      $scope.ref.isListView = f;
      localStorage.setItem("is-list-view", f);
    }
  },
]);

angular.module("web").factory("Project", [
  "BaseHttp",
  "Auth",
  "$state",
  function ($http, Auth, $state) {
    return {
      list: function () {
        var token = Auth.getXToken();
        if (!token) {
          $state.go("login");
          return;
        }

        return $http({
          method: "GET",
          url: Global.endpoint + "/api/projects",
          headers: {
            "x-token": token,
          },
        });
      },
      use: function (projectId) {
        localStorage.setItem("projectId", projectId);
      },
      getCurrentProjectId: function () {
        var v = localStorage.getItem("projectId");
        v = v || (isNaN(v) ? v : parseInt(v));
        return v;
      },
    };
  },
]);

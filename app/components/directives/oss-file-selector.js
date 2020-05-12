/**
angular.extend($scope, {
  ossFsConfig: {
    id: '',
    secret: '',
    region: '',
    bucket: '',
    key: ''
  },
  selectedItem: {
    ossPath:'',
    region: ''
  }
});

<div oss-file-selector config="ossFsConfig"
    selected-path="selectedItem" height="220"
    show-buckets="false" folder-only="true"></div>
*/

angular.module("web").directive("ossFileSelector", [
  "$timeout",
  "ossSvs2",
  function ($timeout, ossSvs2) {
    return {
      restrict: "EA",
      transclude: false,
      scope: {
        config: "=", // {region, bucket, key, id, secret}
        selectedItem: "=", // {region, ossPath}
        showBuckets: "=", // true
        folderOnly: "=", // true
        height: "=", // 200
      },
      templateUrl: "components/directives/oss-file-selector.html",
      controller: ["$scope", ctrl],
    };

    function ctrl($scope) {
      var client;

      if (!$scope.height) $scope.height = 200;
      if ($scope.showBuckets == null) $scope.showBuckets = true;
      if ($scope.folderOnly == null) $scope.folderOnly = true;

      $scope.keepConfig = angular.copy($scope.config);

      refresh();

      function refresh() {
        var v = $scope.keepConfig;
        if (!v.bucket) {
          //if(!$scope.ngModel)$scope.ngModel={};
          $scope.selectedItem.ossPath = "oss://";
          $scope.selectedItem.region = "";
          $scope.isLoading = true;
          ossSvs2.listAllBuckets().then(function (arr) {
            $scope.items = arr;
            $scope.isLoading = false;
          });
        } else {
          if (!v.key) $scope.selectedItem.ossPath = "oss://" + v.bucket + "/";
          else $scope.selectedItem.ossPath = "oss://" + v.bucket + "/" + v.key;

          $scope.selectedItem.region = v.region;

          if (v.key.lastIndexOf("/") == v.key.length - 1) {
            //isFolder
            $scope.isLoading = true;
            ossSvs2
              .listAllFiles(v.region, v.bucket, v.key, $scope.folderOnly)
              .then(function (arr) {
                $scope.items = arr;
                $scope.isLoading = false;
              });
          }
        }
      }

      $scope.$watch("keepConfig", function (v) {
        refresh();
      });

      $scope.select = function (item) {
        if (item.isBucket) {
          $scope.selectedItem.ossPath = "oss://" + item.name;
        } else if (item.isFolder) {
          $scope.selectedItem.ossPath =
            "oss://" +
            $scope.keepConfig.bucket +
            "/" +
            item.path.replace(/\/$/, "") +
            "/";
        } else {
          $scope.selectedItem.ossPath =
            "oss://" +
            $scope.keepConfig.bucket +
            "/" +
            item.path.replace(/\/$/, "");
        }
      };

      $scope.goIn = function (item) {
        if (item.isBucket) {
          $scope.keepConfig.region = item.region;
          $scope.keepConfig.key = "";
          $scope.keepConfig.bucket = item.name;
        } else {
          if (item.isFolder) {
            $scope.keepConfig.key = item.path.replace(/\/$/, "") + "/";
          } else {
            $scope.keepConfig.key = item.path.replace(/\/$/, "");
          }
        }
        refresh();
      };

      $scope.goUp = function () {
        var v = $scope.selectedItem.ossPath;
        if (v == "oss://") {
          return;
        }
        var info = ossSvs2.parseOSSPath(v);

        if (info.key == "") {
          if (!$scope.showBuckets) {
            return;
          }
          $scope.keepConfig.bucket = "";
          $scope.keepConfig.key = "";
          refresh();
          return;
        }

        var key = info.key.replace(/\/$/, "");
        $scope.keepConfig.key = key.substring(0, key.lastIndexOf("/"));
        if ($scope.keepConfig.key != "") {
          $scope.keepConfig.key += "/";
        }
        refresh();
      };
    }
  },
]);

angular
  .module("web", [
    "ui.router",
    "ui.bootstrap",
    "ui.codemirror",
    "pascalprecht.translate",
    "ngSanitize",
    "templates",
    "ui.bootstrap.contextMenu",
  ])
  .config([
    "$stateProvider",
    "$urlRouterProvider",
    "$translateProvider",
    function ($stateProvider, $urlRouterProvider, $translateProvider) {
      moment.locale("zh-CN");

      $stateProvider
        .state("files", {
          url: "/",
          templateUrl: "main/files/files.html",
          controller: "filesCtrl",
        })
        .state("login", {
          url: "/login",
          templateUrl: "main/auth/login.html",
          controller: "loginCtrl",
        });

      $urlRouterProvider.otherwise("/");

      //i18n
      for (var k in Global.i18n) {
        $translateProvider.translations(k, Global.i18n[k].content);
      }
      $translateProvider.preferredLanguage("zh-CN");

      $translateProvider.useSanitizeValueStrategy("escapeParameters");
    },
  ])
  .run([
    "$rootScope",
    "$translate",
    "Toast",
    function ($rootScope, $translate, Toast) {
      $rootScope.openURL = function (url) {
        openExternal(url);
      };

      // //i18n
      var langMap = {};
      var langList = [];
      angular.forEach(Global.i18n, function (v, k) {
        langMap[k] = v;
        langList.push({
          lang: k,
          label: v.label,
        });
      });
      var lang = localStorage.getItem("lang") || langList[0].lang;

      $rootScope.langSettings = {
        langList: langList,
        lang: lang,
        changeLanguage: function (key) {
          console.log("changeLanguage:", key);
          key = langMap[key] ? key : langList[0].lang;
          $translate.use(key);
          localStorage.setItem("lang", key);
          $rootScope.langSettings.lang = key;
          Toast.success($translate.instant("setup.success")); //'已经设置成功'
        },
      };
      $translate.use(lang);

      console.log("ready");
    },
  ]);

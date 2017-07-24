angular.module('web', ['ui.router',
    'ui.bootstrap',
    'ui.codemirror',
    //'pascalprecht.translate',
    'ngSanitize',
    'templates'
  ])
  .config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

      moment.locale('zh-CN');

      $stateProvider
        .state('files', {
          url: '/',
          templateUrl: 'main/files/files.html',
          controller: 'filesCtrl'
        })

        // .state('settings', {
        //   url: '/settings',
        //   templateUrl: 'main/settings/settings.html',
        //   controller: 'settingsCtrl'
        // })

        .state('login', {
          url: '/login',
          templateUrl: 'main/auth/login.html',
          controller: 'loginCtrl'
        });

      $urlRouterProvider.otherwise('/');

      //i18n
      // for(var k in Global.i18n){
      //   $translateProvider.translations(k, Global.i18n[k].content);
      // }
      // $translateProvider.preferredLanguage('zh-CN');
    }
  ])
  .run(['$rootScope',  'I18n', 'Toast', function ($rootScope, I18n, Toast) {
    //i18n
    for(var k in Global.i18n){
       I18n.init(k, Global.i18n[k].content);
    }

    // //i18n
    var langMap = {};
    var langList = [];
    angular.forEach(Global.i18n, function (v,k) {
      langMap[k] = v;
      langList.push({lang: k, label:v.label});
    });
    var lang = localStorage.getItem('lang') || langList[0].lang;

    $rootScope.langSettings={
      langList: langList,
      lang: lang,
      changeLanguage : function (key) {
        console.log('changeLanguage:',key)
        key = langMap[key]?key: langList[0].lang;
        //$translate.use(key);
        I18n.use(key);
        localStorage.setItem('lang',key);
        $rootScope.langSettings.lang = key;
        Toast.success('已经设置成功');
        window.location.reload();
      }
    };
    I18n.use(lang);
    //$translate.use(lang);

    console.log('ready');
  }]);

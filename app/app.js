
angular.module('web', ['ui.router', 'ui.bootstrap','ui.codemirror', 'ngSanitize', 'templates'])
  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

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
      })
    ;

    $urlRouterProvider.otherwise('/');

  }])
  .run(function () {
    console.log('ready');
  });

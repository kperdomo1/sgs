var sgdp = angular.module("sgdp", ["sgdp.login", "ui.router", "ngMaterial", "ngFileUpload"]);


sgdp.controller('MainController',
    ['$rootScope','$scope', 'auth',
        function($rootScope,$scope, auth) {
            $rootScope.model = {};
            $rootScope.model.errorLogin = "";
            $scope.logout = function () {
                $http.get('index.php/login/LoginController/logout');
                auth.logout();
            };
            $scope.isLoggedIn = function() {
              return(auth.isLoggedIn());
            };
        }
    ]
);

sgdp.config(function($stateProvider, $urlRouterProvider, $mdThemingProvider, $locationProvider) {
  $urlRouterProvider.otherwise('login');
  $stateProvider
    .state('login', {
        url: '/login',
        templateUrl: 'index.php/login/LoginController',
        controller: 'LoginController'
    })
    .state('home', {
        url: '/',
        templateUrl: 'index.php/home/HomeController',
        controller: 'HomeController'
    })
    .state('history', {
        url: '/history',
        templateUrl: 'index.php/history/HistoryController',
        controller: 'HistoryController'
    })
    .state('forbidden', {
        url: '/forbidden',
        templateUrl: 'index.php/ForbiddenAccessController'
    });
    // $locationProvider.html5Mode(true);
    // Application theme
    $mdThemingProvider.theme('default')
        .primaryPalette('teal')
        .accentPalette('blue');
    $mdThemingProvider.theme('input')
        .primaryPalette('grey');
});


sgdp.run(['$rootScope', '$location','$state','auth', '$cookies', function ($rootScope, $location, $state, auth, $cookies) {
        $rootScope.$on("$locationChangeStart", function(e, toState, toParams, fromState, fromParams) {

        if (!auth.isLoggedIn() && $location.url() != "/login") {
            // if user is not logged in and is trying to access
            // private content, send to login.
            e.preventDefault();
            $state.go('login');
        }
        else if(auth.isLoggedIn() && $location.url() == "/login") {
            // if user Is logged in and is trying to access login page
            // send to home page (tickets)
            e.preventDefault();
            $state.go('home');
        }
        // else if (auth.isLoggedIn() && !userHasPermission(auth.profile(), $location.url())) {
        //     // check if user actually has access permission to intended url
        //
        //     e.preventDefault();
        //     // if user does not have the propper permission, send home
        //     // or maybe send to error page.
        //     $state.go('forbidden');
        // }
  });

  function userHasPermission(userType, url) {
      switch (url) {
        case '/':
            // Anyone can access home page
            return true;
        case '/history':
            // check for manager rights
            return userType == 1;
      }
      // maybe going to login (.otherwise('login'))? if so, keep going!
      return true;
  }
}])

// factory controlling authentication
// uses cookies to save user session
var login = angular
    .module('sgdp.login', ['ngCookies', 'ngMaterial'])
    .factory('Auth', auth);

auth.$inject = ['$cookies', '$location', '$http', '$rootScope', '$q', 'Agent', 'Manager', 'Constants'];

function auth($cookies, $location, $http, $rootScope, $q, Agent, Manager, Constants) {
    var self = this;

    self.login = function (username, password) {
        var qLogin = $q.defer();
        var data = {id: username, password: password};
        $http.post('index.php/LoginController/authenticate', JSON.stringify(data))
            .then(
            function (response) {
                console.log(response);
                if (response.data.message === "success") {
                    //var now = new Date();
                    //// 1 year exp date
                    //var timeToExpire = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                    // create the session cookie
                    self.setLocalSession({
                        id: username,
                        type: response.data.type,
                        firstName: response.data.name,
                        lastName: response.data.lastNameN
                        //timeToExpire: timeToExpire
                    });
                    qLogin.resolve(response.data.type);

                } else {
                    qLogin.reject(response.data.message);
                }
            }
        );
        return qLogin.promise;
    };

    self.logout = function () {
        console.log('logging out...');
        // remove cookie
        $cookies.remove('session');
        // redirect to login page
        $location.path("/login");
        // Remove possible data on browser's session storage
        cleanBrowser();
        // Clear login form
        $rootScope.model = {};
    };

    self.permission = function () {
        return $cookies.getObject('session').type;
    };

    self.userType = function (type) {
        return $cookies.getObject('session').type == type;
    };

    self.sendHome = function () {
        if (!self.isLoggedIn()) {
            $location.path('/login');
        } else if ($cookies.getObject('session').type == 1) {
            $location.path("/agentHome");
        } else if ($cookies.getObject('session').type == 2) {
            $location.path("/managerHome");
        } else {
            $location.path("/applicantHome");
        }
    };

    self.isLoggedIn = function () {
        return typeof $cookies.get('session') !== "undefined";
    };

    self.updateSession = function (newType) {
        var qSession = $q.defer();
        $http.post('LoginController/updateSession', {newType: newType})
            .then(
            function (response) {
                if (response.status == 200) {
                    qSession.resolve();
                } else {
                    qSession.reject('Ha ocurrido un error en el servidor. Por favor intente más tarde');
                }
            }
        );
        return qSession.promise;
    };

    self.setLocalSession = function (user) {
        if (user.timeToExpire) {
            $cookies.putObject('session', {
                id: user.id,
                type: user.type,
                firstName: user.firstName,
                lastName: user.lastName
            }, {
                expires : user.timeToExpire
            });
        } else {
            // Cookie will be automatically deleted upon closing connection.
            $cookies.putObject('session', {
                id: user.id,
                type: user.type,
                firstName: user.firstName,
                lastName: user.lastName
            });
        }
    };

    self.getLocalSession = function () {
        return $cookies.getObject('session');
    };

    // Clears possible data stored on browser
    function cleanBrowser() {
        sessionStorage.removeItem("req");
        Agent.clearData();
        Manager.clearData();
    }

    return self;
}

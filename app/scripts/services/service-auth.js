// factory controlling authentication
// uses cookies to save user session
angular.module('sgdp.login', ['ngCookies', 'ngMaterial']).factory('Auth', function ($cookies, $location, $http, $rootScope, $q, Applicant, Agent, Manager, Constants) {
    var self = this;

    self.login = function (username, password) {
        var qLogin = $q.defer();
        var data = {id: username, password: password};
        $http.post(Constants.SERVER_URL + 'LoginController/authenticate', JSON.stringify(data))
            .then(
            function (response) {
                if (response.data.message === "success") {
                    //var now = new Date();
                    //// 1 year exp date
                    //var timeToExpire = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                    // create the session cookie
                    self.setLocalSession({
                        id: username,
                        type: response.data.type,
                        firstName: response.data.name,
                        lastName: response.data.lastName
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

    self.removeSession = function () {
        $cookies.remove('session');
    };

    self.logout = function (permission) {
        var type = permission || self.permission();
        // remove cookie
        $cookies.remove('session');
        // Remove possible data on browser's session storage
        cleanBrowser();
        // Clear login form
        $rootScope.model = {};
        // redirect to IPAPEDI login page
        if (type == Constants.Users.MANAGER || type == Constants.Users.AGENT || type == Constants.Users.REVISER) {
            window.location.replace(Constants.IPAPEDI_URL + 'administracion/cerrarSesion');
        } else {
            window.location.replace(Constants.IPAPEDI_URL + 'asociados/cerrar');
        }
    };

    self.permission = function () {
        return $cookies.getObject('session') ? $cookies.getObject('session').type : null;
    };

    self.userType = function (type) {
        return $cookies.getObject('session') ? $cookies.getObject('session').type == type : false;
    };

    self.sendHome = function () {
        if (!self.isLoggedIn()) {
            $location.path('/login');
        } else if ($cookies.getObject('session').type == Constants.Users.AGENT) {
            $location.path("/agentHome");
        } else if ($cookies.getObject('session').type == Constants.Users.MANAGER) {
            $location.path("/managerHome");
        } else if ($cookies.getObject('session').type == Constants.Users.APPLICANT) {
            $location.path("/applicantHome");
        } else if ($cookies.getObject('session').type == Constants.Users.REVISER) {
            $location.path("/reviserHome");
        }
    };

    self.isLoggedIn = function () {
        return typeof $cookies.get('session') !== "undefined";
    };

    self.updateSession = function (newType) {
        var qSession = $q.defer();
        $http.post(Constants.SERVER_URL + 'LoginController/updateSession', {newType: newType})
            .then(
            function (response) {
                console.log(response);
                if (response.data.message == 'success') {
                    qSession.resolve();
                } else {
                    qSession.reject(response.data.message);
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

    self.verifyUser = function (token) {
        var qLogin = $q.defer();
        $http.post(Constants.SERVER_URL + 'LoginController/verifyUser', {token: token}).then(
            function (response) {
                if (response.data.message === "success") {
                    // create the session cookie
                    self.setLocalSession({
                        id: response.data.id,
                        type: response.data.type,
                        firstName: response.data.name,
                        lastName: response.data.lastName
                    });
                    qLogin.resolve(response.data.type);

                } else {
                    qLogin.reject(response.data.message);
                }
            }
        );
        return qLogin.promise;
    };

    self.getLocalSession = function () {
        return $cookies.getObject('session');
    };

    // Clears possible data stored on browser
    function cleanBrowser() {
        sessionStorage.removeItem("req");
        Applicant.clearData();
        Agent.clearData();
        Manager.clearData();
    }

    return self;
});
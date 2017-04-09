angular
    .module('sgdp')
    .controller('DetailsController', details);

details.$inject = ['$scope', 'Utils', 'Requests', 'Auth', 'Config', 'Constants', '$mdDialog', '$mdMedia', '$state'];

function details($scope, Utils, Requests, Auth, Config, Constants, $mdDialog, $mdMedia, $state) {
    'use strict';

    // If no data has been sent, show nothing.
    if (sessionStorage.getItem("req") === null) { return; }
    var fetchId = sessionStorage.getItem("uid");
    $scope.req = JSON.parse(sessionStorage.getItem("req"));

    // This would happen in case user reloads (F5) being in the details view.
    if (!Config.loanConcepts) {
        Config.loanConcepts = JSON.parse(sessionStorage.getItem("loanConcepts"));
    }

    $scope.showMsg = true;
    $scope.APPROVED = Constants.Statuses.APPROVED;
    $scope.loanTypes = Config.loanConcepts;

    if ($scope.req.status == $scope.APPROVED) {
        $scope.loading = true;
        Requests.getAvailabilityData(fetchId, $scope.req.type).then(
            function (data) {
                $scope.dateAvailable = data.granting.dateAvailable;
                $scope.loading = false;
            },
            function (error) {
                $scope.loading = false;
                Utils.showAlertDialog('Oops!', error);
            }
        )
    }
    $scope.pad = function (n, width, z) {
        return Utils.pad(n, width, z);
    };

    // Calculates the request's payment fee.
    $scope.calculatePaymentFee = function() {
        return $scope.req ? Requests.calculatePaymentFee($scope.req.reqAmount,
                                                         $scope.req.due,
                                                         Requests.getInterestRate($scope.req.type)) : 0;
    };

    $scope.downloadDoc = function (doc) {
        window.open(Requests.getDocDownloadUrl(doc.id));
    };

    $scope.downloadAll = function () {
        location.href = Requests.getAllDocsDownloadUrl($scope.req.docs);
    };

    $scope.deleteRequest = function (ev) {
        Utils.showConfirmDialog(
            'Confirmación de eliminación',
            'Al eliminar la solicitud, también se eliminarán ' +
            'todos los datos asociados a ella.',
            'Continuar',
            'Cancelar',
            ev, true).then(
            function() {
                $scope.overlay = true;
                Requests.deleteRequestUI($scope.req).then(
                    function () {
                        $scope.overlay = false;
                        Utils.showAlertDialog('Solicitud eliminada', "La solicitud fue eliminada exitosamente.");
                        $scope.goHome();
                    },
                    function (errorMsg) {
                        $scope.overlay = false;
                        Utils.showAlertDialog('Oops!', errorMsg);
                    }
                );
            }
        );
    };

    /**
     * Opens the edition request dialog and performs the corresponding operations.
     *
     * @param $event - DOM event.
     * @param obj - optional obj containing user input data.
     */
    $scope.openEditRequestDialog = function ($event, obj) {
        var parentEl = angular.element(document.body);
        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            templateUrl: 'NewRequestController',
            clickOutsideToClose: false,
            escapeToClose: false,
            autoWrap: false,
            fullscreen: $mdMedia('xs'),
            locals: {
                fetchId: fetchId,
                request: $scope.req,
                obj: obj,
                parentScope: $scope
            },
            controller: DialogController
        });
        // Isolated dialog controller for the new request dialog
        function DialogController($scope, $mdDialog, fetchId, request, parentScope, obj) {
            $scope.docPicTaken = false;
            $scope.uploading = false;
            $scope.uploadErr = '';
            // Hold scope reference to constants
            $scope.APPLICANT = Constants.Users.APPLICANT;
            $scope.AGENT = Constants.Users.AGENT;

            // obj could have a reference to user data, saved
            // before confirmation dialog was opened.
            var model = {
                reqAmount: request.reqAmount,
                type: parseInt(request.type, 10),
                due: request.due,
                phone: Utils.pad(request.phone, 11),
                email: request.email
            };
            $scope.model = obj || model;
            $scope.model.loanTypes = Config.loanConcepts;
            $scope.confirmButton = 'Editar';
            $scope.title = 'Edición de solicitud';

            // if user came back to this dialog after confirming operation..
            if ($scope.model.confirmed) {
                // Go ahead and proceed with edition
                editRequest();
            } else {
                checkCreationConditions();
            }

            function checkCreationConditions () {
                $scope.loading = true;
                Requests.getAvailabilityData(fetchId, model.type).then(
                    function (data) {
                        Requests.checkPreviousRequests(fetchId, model.type).then(
                            function (opened) {
                                data.opened = opened;
                                Requests.getLoanTerms(model.type).then(
                                    function (terms) {
                                        $scope.maxReqAmount = Requests.getMaxAmount();
                                        $scope.minReqAmount = Requests.getMinAmount();
                                        $scope.model.terms = terms;
                                        Requests.verifyAvailability(data, model.type, true);
                                        $scope.loading = false;
                                    },
                                    function (error) {
                                        Utils.showAlertDialog('Oops!', error);
                                    }
                                );
                            },
                            function (error) {
                                Utils.showAlertDialog('Oops!', error);
                            }
                        );
                    },
                    function (error) {
                        Utils.showAlertDialog('Oops!', error);
                    }
                );
            }

            $scope.missingField = function () {
                return (typeof $scope.model.reqAmount === "undefined"
                       || typeof $scope.model.phone === "undefined"
                       || typeof $scope.model.email === "undefined"
                       || !$scope.model.due)
                       || ($scope.model.reqAmount === request.reqAmount &&
                           Utils.pad($scope.model.phone, 11) === request.phone &&
                           $scope.model.email === request.email &&
                           parseInt($scope.model.due, 10) === request.due);
            };

            $scope.closeDialog = function () {
                $mdDialog.hide();
            };

            $scope.calculatePaymentFee = function() {
                if ($scope.model.reqAmount && $scope.model.due) {
                    return Requests.calculatePaymentFee($scope.model.reqAmount,
                                                        $scope.model.due,
                                                        Requests.getInterestRate($scope.model.type));
                } else {
                    return 0;
                }
            };

            // Edits request in database.
            function editRequest() {
                $scope.uploading = true;
                performEdition();
            }

            // Helper function that performs request edition
            function performEdition() {
                var postData = {
                    rid: request.id,
                    userId: fetchId,
                    reqAmount: $scope.model.reqAmount,
                    tel: Utils.pad($scope.model.phone, 11),
                    due: $scope.model.due,
                    loanType: parseInt($scope.model.type, 10),
                    email: $scope.model.email
                };
                Requests.editRequest(postData).then(
                    function(updatedReq) {
                        Utils.showAlertDialog(
                            'Solicitud editada',
                            'La información de su solicitud ha sido editada exitosamente'
                        );
                        // Update saved request and reload view.
                        sessionStorage.setItem("req", JSON.stringify(updatedReq));
                        $state.go($state.current, {}, {reload: true})
                    },
                    function(error) {
                        $scope.uploading = false;
                        Utils.showAlertDialog('Oops!', error);
                    }
                );
            }

            // Sets the bound input to the max possibe request amount
            $scope.setMax = function() {
                $scope.model.reqAmount = $scope.maxReqAmount;
            };

            // Shows a dialog asking user to confirm the request creation.
            $scope.confirmOperation = function (ev) {
                Utils.showConfirmDialog(
                    'Confirmación de edición de solicitud',
                    'Se guardarán los cambios que hayan realizado a su solicitud. ¿Desea proceder?',
                    'Sí', 'Cancelar', ev, true
                ).then(
                    function() {
                        // Re-open parent dialog and perform request creation
                        $scope.model.confirmed = true;
                        parentScope.openEditRequestDialog(null, $scope.model);
                    },
                    function() {
                        // Re-open parent dialog and do nothing
                        parentScope.openEditRequestDialog(null, $scope.model);
                    }
                );
            };
        }
    };

    $scope.validateRequest = function (ev) {
        Utils.showConfirmDialog(
            'Advertencia',
            'Luego de validar su solicitud no podrá editarla ni eliminarla. ¿Desea continuar?' ,
            'Continuar',
            'Cancelar',
            ev, true).then(
            function() {
                $scope.overlay = true;
                $scope.validating = true;
                Requests.validateRequest($scope.req.id).then(
                    function (date) {
                        $scope.overlay = false;
                        $scope.validating = false;
                        Utils.showAlertDialog('Solicitud validada',
                                              'Su solicitud será atendida en menos de 48 horas hábiles.');
                        $scope.req.validationDate = date;
                    },
                    function (error) {
                        $scope.overlay = false;
                        $scope.validating = false;
                        Utils.showAlertDialog('Oops!', error);
                    }
                );
            });
    };


    $scope.goHome = function () {
        Auth.sendHome();
    };
}

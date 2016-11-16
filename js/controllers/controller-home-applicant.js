angular
    .module('sgdp')
    .controller('ApplicantHomeController', userHome);

userHome.$inject = ['$scope', '$http', '$cookies', '$timeout', 'FileUpload', 'Helps',
                    '$mdSidenav', '$mdDialog', 'Upload', '$mdMedia', 'Constants', 'Requests', 'Utils'];

function userHome($scope, $http, $cookies, $timeout, FileUpload, Helps,
                  $mdSidenav, $mdDialog, Upload, $mdMedia, Constants, Requests, Utils) {
    'use strict';
    $scope.loading = true;
    $scope.selectedReq = '';
    $scope.selectedLoan = -1;
    $scope.requests = {};
    $scope.docs = [];
    $scope.showList = {pp: false, vc: false};
    $scope.fetchError = '';
    // contentAvailable will indicate whether sidenav can be visible
    $scope.contentAvailable = false;
    // contentLoaded will indicate whether sidenav can be locked open
    $scope.contentLoaded = false;
    $scope.listTitle = Requests.getTypeTitles();

    var fetchId = $cookies.getObject('session').id;
    $scope.loading = true;
    // Fetch user's requests
    Requests.getUserRequests(fetchId).then(
        function (data) {
            $scope.requests = data;
            $scope.loading = false;
            $scope.contentAvailable = true;
            $timeout(function () {
                $scope.contentLoaded = true;
                $mdSidenav('left').open();
            }, 600);
        },
        function (errorMsg) {
            $scope.fetchError = errorMsg;
            $scope.loading = false;
        }
    );

    $scope.toggleList = function (index) {
        $scope.showList[index] = !$scope.showList[index];
    };

    /**
     * Selects the specified request.
     *
     * @param i - row index of the selected request in $scope.requests
     * @param j - column index of the selected request in $scope.requests
     */
    $scope.selectRequest = function (i, j) {
        if (i != -1 && j != -1) {
            $scope.selectedReq = i;
            $scope.selectedLoan = j;
            console.log(i);
            console.log(j);
            $scope.docs = $scope.requests[i][j].docs;
        }
        $mdSidenav('left').toggle();
    };

    /**
     * Opens the New Request dialog and performs the corresponding operations.
     *
     * @param $event - DOM event.
     * @param obj - optional obj containing user input data.
     */
    $scope.openNewRequestDialog = function ($event, obj) {
        var parentEl = angular.element(document.body);
        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            templateUrl: 'index.php/NewRequestController',
            clickOutsideToClose: false,
            escapeToClose: false,
            autoWrap: false,
            locals: {
                fetchId: fetchId,
                requestNumb: Requests.getTotalLoans($scope.requests),
                obj: obj,
                parentScope: $scope
            },
            controller: DialogController
        });
        // Isolated dialog controller for the new request dialog
        function DialogController($scope, $mdDialog, fetchId,
                                  requestNumb, parentScope, obj) {
            $scope.docPicTaken = false;
            $scope.uploading = false;
            $scope.maxReqAmount = Requests.getMaxAmount();
            // if user data exists, it means the ID was
            // already given, so we must show it.
            $scope.idPicTaken = obj && obj.idFile ? true : false;
            $scope.uploadErr = '';
            // Hold scope reference to constants
            $scope.APPLICANT = Constants.Users.APPLICANT;
            $scope.AGENT = Constants.Users.AGENT;
            $scope.PERSONAL = Constants.LoanTypes.PERSONAL;
            $scope.CASH_VOUCHER = Constants.LoanTypes.CASH_VOUCHER;
            // obj could have a reference to user data, saved
            // before confirmation dialog was opened.
            $scope.model = obj || {due: 24, type: $scope.PERSONAL, tel: {operator: '0412'}};
            // Will notify whether all files were uploaded.
            var uploadedFiles;
            // Will contain docs to create in DB
            var docs = [];

            // if user came back to this dialog after confirming operation..
            if ($scope.model.confirmed) {
                // Go ahead and proceed with creation
                createNewRequest();
            }

            $scope.closeDialog = function () {
                $mdDialog.hide();
            };

            $scope.missingField = function () {
                return !$scope.idPicTaken ||
                       typeof $scope.model.reqAmount === "undefined" ||
                       !$scope.model.tel.value;
            };

            $scope.deleteIdPic = function (event) {
                $scope.idPicTaken = false;
                $scope.model.idFile = {};
                // Stops click propagation (which would open)
                // the camera again.
                event.stopPropagation();
            };

            $scope.deleteDocPic = function () {
                $scope.docPicTaken = false;
            };

            $scope.gatherIDFile = function (file, errFiles) {
                if (file) {
                    $scope.model.idFile = file;
                    $scope.model.idFile.description = "Comprobación de autorización";
                    $scope.model.idFile.docName = "Identidad";
                    $scope.idPicTaken = true;
                }
                $scope.errFiles = errFiles;
            };

            $scope.gatherDocFile = function (file, errFiles) {
                if (file) {
                    $scope.docFile = file;
                    $scope.docFile.description = "Documento explicativo " +
                                                 "de la solicitud";
                    $scope.docFile.docName = "Solicitud";
                    $scope.docPicTaken = true;
                }
                $scope.errFiles = errFiles;
            };

            $scope.showIdError = function (error, param) {
                FileUpload.showIdUploadError(error, param);
            };

            $scope.showError = function (error, param) {
                FileUpload.showDocUploadError(error, param)
            };

            // Creates new request in database and uploads documents
            function createNewRequest() {
                $scope.uploading = true;
                var docs = [];

                // Upload ID document.
                FileUpload.uploadFile($scope.model.idFile).then(
                    function (uploadedDoc) {
                        docs.push(uploadedDoc);
                        performCreation(0)
                    },
                    function (errorMsg) {
                        $scope.errorMsg = errorMsg;
                    }
                );
            }

            // Helper function that performs the document's creation.
            function performCreation(autoSelectIndex) {
                var postData = {
                    userId: fetchId,
                    reqAmount: $scope.model.reqAmount,
                    tel: parseInt($scope.model.tel.operator + $scope.model.tel.value, 10),
                    due: $scope.model.due,
                    loanType: $scope.model.type,
                    docs: docs
                };
                Requests.createRequest(postData).then(
                    function() {
                        updateRequestListUI(fetchId, autoSelectIndex,
                                            'Solicitud creada',
                                            'La solicitud ha sido creada exitosamente.',
                                            true, true,
                                            parseInt(postData.loanType, 10));
                    }
                );
            }

            // Determines wether the specified userType matches
            // logged user's type
            $scope.userType = function (type) {
                return type === $cookies.getObject('session').type;
            };

            // Sets the bound input to the max possibe request amount
            $scope.setMax = function() {
                $scope.model.reqAmount = $scope.maxReqAmount;
            };

            // Shows a dialog asking user to confirm the request creation.
            $scope.confirmCreation = function (ev) {
                Utils.showConfirmDialog(
                    'Confirmación de creación de solicitud',
                    'El sistema generará el documento correspondiente a su solicitud y será' +
                    ' atendida a la mayor brevedad posible. ¿Desea proceder con su solicitud?',
                    'Sí', 'Cancelar', ev, true
                ).then(
                    function() {
                        // Re-open parent dialog and perform request creation
                        $scope.model.confirmed = true;
                        parentScope.openNewRequestDialog(null, $scope.model);
                    },
                    function() {
                        // Re-open parent dialog and do nothing
                        parentScope.openNewRequestDialog(null, $scope.model);
                    }
                );
            };

            $scope.showHelp = function () {
                showFormHelp(Helps.getDialogsHelpOpt());
            };

            /**
             * Shows tour-based help of all input fields.
             * @param options: Obj containing tour.js options
             */
            function showFormHelp(options) {
                var tripToShowNavigation;
                if (!$scope.missingField()) {
                    tripToShowNavigation = new Trip([
                        // Tell user to hit the create button
                        {
                            sel: $("#create-btn"),
                            content: "Haga click en CREAR para generar " +
                                     "la solicitud.",
                            position: "n", animation: 'fadeInLeft'
                        }

                    ], options);
                    tripToShowNavigation.start();
                } else {
                    tripToShowNavigation = new Trip([], options);
                    showAllFieldsHelp(tripToShowNavigation);
                }
            }

            function showAllFieldsHelp(tripToShowNavigation) {
                var content = '';
                if (!$scope.model.reqAmount) {
                    // Requested amount field
                    content = "Ingrese la cantidad de Bs. que " +
                                  "desea solicitar.";
                    Helps.addFieldHelp(tripToShowNavigation, "#req-amount",
                                  content, 's');
                }
                if (!$scope.model.phone) {
                    // Requested amount field
                    content = "Ingrese su número telefónico, a través " +
                                  "del cual nos estaremos comunicando con usted.";
                    Helps.addFieldHelp(tripToShowNavigation, "#phone-numb",
                                  content, 'n');
                }
                if (!$scope.idPicTaken) {
                    // Show id pic field help
                    content = "Haga click para subir su cédula de " +
                                  "identidad en digital.";
                    Helps.addFieldHelp(tripToShowNavigation, "#id-pic", content, 'n');
                }
                // Add payment due help.
                content = "Escoja el plazo (en meses) en el que desea " +
                                "pagar su deuda.";
                Helps.addFieldHelp(tripToShowNavigation, "#payment-due", content, 'n');
                // Add loan type help.
                content = "Escoja el tipo de préstamo que desea solicitar.";
                Helps.addFieldHelp(tripToShowNavigation, "#loan-type", content, 'n');
                tripToShowNavigation.start();
            }
        }
    };

    // Helper method that updates UI's request list.
    function updateRequestListUI(userId, autoSelectIndex,
                                 dialogTitle, dialogContent,
                                 updateUI, toggleList, type) {
        // Update interface
        Requests.getUserRequests(userId).then(
            function (data) {
                // Update UI only if needed
                var loanType = Requests.mapLoanTypes(type);
                if (updateUI) {
                    updateContent(data, loanType, autoSelectIndex);
                }
                // Toggle request list only if requested.
                if (toggleList) {
                    toggleReqList(loanType);
                }
                // Close dialog and alert user that operation was
                // successful
                $mdDialog.hide();
                Utils.showAlertDialog(dialogTitle, dialogContent);
            },
            function (errorMsg) {
                console.log("REFRESHING ERROR!");
                console.log(errorMsg);
            }
        );
    }

    /**
     * Helper function that updates content with new request.
     *
     * @param newRequests - the updated requests obj.
     * @param req - New request's type.
     * @param selection - Specific request's index.
     */
    function updateContent(newRequests, req, selection) {
        $scope.contentLoaded = true;
        $scope.contentAvailable = true;
        $scope.fetchError = '';
        $scope.requests = newRequests;
        // Automatically select created request
        $scope.selectRequest(req, selection);
    }

    /**
     * Automatically toggles the requests list.
     *
     * @param index - Request list's index
     */
    function toggleReqList(index) {
        // Close the list
        // $scope.showList[index] = false;
        closeAllReqList();
        $timeout(function () {
            // Open the list
            $scope.showList[index] = true;
        }, 1000);

    }

    function closeAllReqList() {
        angular.forEach($scope.showList, function(show, index) {
            $scope.showList[index] = false;
        });
    }

    // Helper function for formatting numbers with leading zeros
    $scope.pad = function (n, width, z) {
        return Utils.pad(n, width, z);
    };

    $scope.downloadDoc = function (doc) {
        window.open(Requests.getDocDownloadUrl(doc.lpath));
    };

    $scope.downloadAll = function () {
        location.href = Requests.getAllDocsDownloadUrl($scope.docs);
    };

    $scope.openMenu = function () {
        $mdSidenav('left').toggle();
    };


    $scope.showHelp = function () {
        if ($scope.docs.length == 0) {
            // User has not selected any request yet, tell him to do it.
            showSidenavHelp(Helps.getDialogsHelpOpt());
        } else {
            // Guide user through request selection's possible actions
            showRequestHelp(Helps.getDialogsHelpOpt());
        }
    };

    /**
     * Shows tour-based help of side navigation panel
     * @param options: Obj containing tour.js options
     */

    function showSidenavHelp(options) {
        var responsivePos = $mdMedia('xs') ? 'n' : 'w';
        var tripToShowNavigation = new Trip([], options);
        var content;
        if ($mdSidenav('left').isLockedOpen() && Requests.getTotalLoans($scope.requests) > 0) {
            options.showHeader = true;
            content = "Seleccione alguna de sus solicitudes en la lista para ver más detalles.";
            Helps.addFieldHelpWithHeader(tripToShowNavigation, '#requests-list', content, 'e',
                                         'Panel de navegación', true);
            content = "También puede crear una solicitud haciendo click aquí";
            Helps.addFieldHelpWithHeader(tripToShowNavigation, '#new-req-fab', content, responsivePos,
                                         'Crear solicitud', true);
            tripToShowNavigation.start();
        } else if ($scope.contentLoaded && Requests.getTotalLoans($scope.requests) > 0) {
            content = "Haga click en el ícono para abrir el panel de navegación y seleccionar alguna " +
                      "de sus solicitudes para ver más detalles";
            Helps.addFieldHelp(tripToShowNavigation, '#nav-panel', content, 's', true);
            content = "También puede crear una solicitud haciendo click aquí";
            Helps.addFieldHelp(tripToShowNavigation, '#new-req-fab', content, responsivePos, true);
            tripToShowNavigation.start();
        } else {
            options.showHeader = true;
            content = "Para crear una solicitud haga click aquí";
            Helps.addFieldHelpWithHeader(tripToShowNavigation, '#new-req-fab', content, responsivePos,
                                         'Crear solicitud');
            tripToShowNavigation.start();
        }
    }

    /**
     * Shows tour-based help of selected request details section.
     * @param options: Obj containing tour.js options
     */
    function showRequestHelp(options) {
        options.showHeader = true;
        var responsivePos = $mdMedia('xs') ? 's' : 'w';
        var tripToShowNavigation = new Trip([], options);
        var content;
        // Request summary information
        content = "Aquí se muestra información acerca de la fecha de creación, monto solicitado " +
                  "por usted, y un posible comentario.";
        Helps.addFieldHelpWithHeader(tripToShowNavigation, '#request-summary', content, responsivePos,
                                     'Resumen de la solicitud', true);
        // Request status information
        content = "Esta sección provee información acerca del estatus de su solicitud.";
        Helps.addFieldHelpWithHeader(tripToShowNavigation, '#request-status-summary', content, 's',
                                     'Resumen de estatus', true);
        // Request documents information
        content = "Éste y los siguientes " +
                  "items contienen el nombre y una posible descripción de " +
                  "cada documento en su solicitud. Puede verlos/descargarlos " +
                  "haciendo click encima de ellos.";
        Helps.addFieldHelpWithHeader(tripToShowNavigation, '#request-docs', content, 's',
                                     'Documentos', true);
        // Download as zip information
        content = "También puede descargar todos los documentos haciendo click aquí.";
        Helps.addFieldHelpWithHeader(tripToShowNavigation, '#request-summary-actions', content, responsivePos,
                                     'Descargar todo', true);
        tripToShowNavigation.start();
    }
}

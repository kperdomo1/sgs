angular
    .module('sgdp')
    .controller('UserHomeController', userHome);

userHome.$inject = ['$scope', '$http', '$cookies', '$timeout',
                    '$mdSidenav', '$mdDialog', 'Upload', '$mdMedia'];

function userHome($scope, $http, $cookies, $timeout,
                  $mdSidenav, $mdDialog, Upload, $mdMedia) {
    'use strict';
    $scope.loading = true;
    $scope.selectedReq = -1;
    $scope.requests = [];
    $scope.docs = [];
    $scope.showList = false;
    $scope.fetchError = '';
    // contentAvailable will indicate whether sidenav can be visible
    $scope.contentAvailable = false;
    // contentLoaded will indicate whether sidenav can be locked open
    $scope.contentLoaded = false;

    var fetchId = $cookies.getObject('session').id;
    $http.get('index.php/home/UserHomeController/getUserRequests',
        {params: {fetchId: fetchId}})
        .then(function (response) {
                  $scope.maxReqAmount = response.data.maxReqAmount;
                  if (response.data.message === "success") {
                      if (typeof response.data.requests !== "undefined") {
                          $scope.requests = response.data.requests;
                      }
                      $scope.contentAvailable = true;
                      $timeout(function () {
                          $scope.contentLoaded = true;
                          $mdSidenav('left').open();
                          $timeout(function () {
                              if ($scope.requests.length > 0) {
                                  $scope.showList = true;
                                  // $scope.selectRequest(0);
                              }
                          }, 600);
                      }, 600);
                  } else {
                      $scope.fetchError = response.data.message;
                  }
                  $scope.loading = false;
              });

    $scope.toggleList = function () {
        $scope.showList = !$scope.showList;
    };

    $scope.selectRequest = function (req) {
        $scope.selectedReq = req;
        if (req != -1) {
            $scope.docs = $scope.requests[req].docs;
        }
        $mdSidenav('left').toggle();
    };

    $scope.openNewRequestDialog = function ($event) {
        var parentEl = angular.element(document.body);
        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            templateUrl: 'index.php/documents/NewRequestController',
            clickOutsideToClose: false,
            escapeToClose: false,
            autoWrap: false,
            locals: {
                fetchId: fetchId,
                maxReqAmount: $scope.maxReqAmount,
                requestNumb: $scope.requests.length + 1
            },
            controller: DialogController
        });
        // Isolated dialog controller for the new request dialog
        function DialogController($scope, $mdDialog, fetchId, maxReqAmount,
                                  requestNumb) {
            $scope.idPicTaken = false;
            $scope.docPicTaken = false;
            $scope.uploading = false;
            $scope.maxReqAmount = maxReqAmount;
            $scope.model = {};
            $scope.uploadErr = '';
            // Will notify whether all files were uploaded.
            var uploadedFiles;
            // Will contain docs to create in DB
            var docs = [];

            $scope.closeDialog = function () {
                $mdDialog.hide();
            };

            $scope.missingField = function () {
                return !$scope.idPicTaken ||
                       typeof $scope.model.reqAmount === "undefined";
            };

            $scope.deleteIdPic = function () {
                $scope.idPicTaken = false;
            };

            $scope.deleteDocPic = function () {
                $scope.docPicTaken = false;
            };

            $scope.gatherIDFile = function (file, errFiles) {
                if (file) {
                    $scope.idFile = file;
                    $scope.idFile.description = "Comprobación de autorización";
                    $scope.idFile.docName = "Identidad";
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

            $scope.showError = function (error, param) {
                if (error === "pattern") {
                    return "Archivo no aceptado. Por favor seleccione " +
                           "sólo documentos.";
                } else if (error === "maxSize") {
                    return "El archivo es muy grande. Tamaño máximo es: " +
                           param;
                }
            };

            // Creates new request in database and uploads documents
            $scope.createNewRequest = function () {
                $scope.uploading = true;
                uploadedFiles = new Array($scope.docPicTaken ? 2 : 1).
                    fill(false);

                // Upload ID document.
                uploadFile($scope.idFile, 0);
                if ($scope.docPicTaken) {
                    // Upload the optional document.
                    uploadFile($scope.docFile, 1);
                }
            };

            // Determines whether all files were uploaded
            function uploadsFinished(uploadedFiles) {
                return (uploadedFiles.filter(function (bool) {
                    return !bool;
                }).length == 0);
            }

            // Uploads each of selected documents to the server
            // and updates database
            function uploadFile(file, uploadIndex) {
                file.upload = Upload.upload({
                    url: 'index.php/documents/NewRequestController/upload',
                    data: {
                        file: file,
                        userId: fetchId,
                        requestNumb: requestNumb
                    }
                });

                file.upload.then(function (response) {
                    // Register upload success
                    uploadedFiles[uploadIndex] = true;
                    // Add doc info
                    docs.push({
                        lpath: response.data.lpath,
                        docName: file.docName,
                        description: file.description
                    });

                    if (uploadsFinished(uploadedFiles)) {
                        // If all files were uploaded, proceed to
                        // database entry creation.
                        performCreation(0);
                    }
                }, function (response) {
                    // Show upload error
                    if (response.status > 0)
                        $scope.errorMsg = response.status + ': ' + response.data;
                }, function (evt) {
                    // Upload file upload progress
                    file.progress = Math.min(100, parseInt(100.0 *
                                                           evt.loaded / evt.total));
                });
            }

            // Helper function that performs the document's creation.
            function performCreation(autoSelectIndex) {
                var postData = {
                    userId: fetchId,
                    reqAmount: $scope.model.reqAmount,
                    docs: docs
                };
                $http.post('index.php/documents/NewRequestController/createRequest',
                           JSON.stringify(postData))
                    .then(function (response) {
                              if (response.status == 200) {
                                  updateRequestListUI(fetchId, autoSelectIndex,
                                                      'Solicitud creada',
                                                      'La solicitud ha sido creada exitosamente.',
                                                      true, true);
                              }
                          });
            }

            // Determines wether the specified userType matches
            // logged user's type
            $scope.userType = function (type) {
                return type === $cookies.getObject('session').type;
            };

            $scope.showHelp = function () {
                var options = {
                    showNavigation: true,
                    showCloseBox: true,
                    delay: -1,
                    tripTheme: "dark",
                    prevLabel: "Anterior",
                    nextLabel: "Siguiente",
                    finishLabel: "Entendido"
                };
                showFormHelp(options);
            };
            /**
             * Shows tour-based help of all input fields.
             * @param options: Obj containing tour.js options
             */
            function showFormHelp(options) {
                if (!$scope.missingField()) {
                    var tripToShowNavigation = new Trip([
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
                    var tripToShowNavigation = new Trip([], options);
                    showAllFieldsHelp(tripToShowNavigation);
                }
            }

            function showFieldHelp(trip, id, content, pos) {
                trip.tripData.push(
                    {
                        sel: $(id), content: content, position: pos,
                        animation: 'fadeInUp'
                    }
                );
            }

            function showAllFieldsHelp(tripToShowNavigation) {
                if (!$scope.model.reqAmount) {
                    // Requested amount field
                    var content = "Ingrese la cantidad de Bs. que " +
                                  "desea solicitar.";
                    showFieldHelp(tripToShowNavigation, "#req-amount",
                                  content, 's');
                }
                if (!$scope.idPicTaken) {
                    // Show id pic field help
                    var content = "Haga click para subir su cédula de " +
                                  "identidad en digital.";
                    showFieldHelp(tripToShowNavigation, "#id-pic", content, 'n');
                }
                if (!$scope.docPicTaken) {
                    // Show doc pic field help
                    var content = "Haga click para opcionalmente proveer " +
                                  "un documento explicativo de la solicitud.";
                    showFieldHelp(tripToShowNavigation, "#doc-pic", content, 'n');
                }
                tripToShowNavigation.start();
            }
        }
    };

    // Helper method that updates UI's request list.
    function updateRequestListUI(userId, autoSelectIndex,
                                 dialogTitle, dialogContent,
                                 updateUI, toggleList) {
        // Update interface
        $http.get('index.php/home/AgentHomeController/getUserRequests',
            {params: {fetchId: userId}})
            .then(function (response) {
                      if (response.status == 200) {
                          // Update UI only if needed
                          if (updateUI) {
                              updateContent(response.data.requests,
                                            autoSelectIndex);
                          }
                          // Toggle request list only if requested.
                          if (toggleList) {
                              toggleReqList();
                          }
                          // Close dialog and alert user that operation was
                          // successful
                          $mdDialog.hide();
                          showAlertDialog(dialogTitle, dialogContent);

                      } else {
                          console.log("REFRESHING ERROR!");
                          console.log(response);
                      }
                  });
    }

    // Helper function that shows an alert dialog message
    // to user.
    function showAlertDialog(dialogTitle, dialogContent) {
        $mdDialog.show(
            $mdDialog.alert()
                .parent(angular.element(document.body))
                .clickOutsideToClose(true)
                .title(dialogTitle)
                .textContent(dialogContent)
                .ariaLabel(dialogTitle)
                .ok('Ok')
        );
    }

    // Helper function that updates content with new request
    function updateContent(requests, selection) {
        $scope.contentLoaded = true;
        $scope.contentAvailable = true;
        $scope.fetchError = '';
        $scope.requests = requests;
        // Automatically select created request
        $scope.selectRequest(selection);
    }

    function toggleReqList() {
        // Toggle list
        $scope.showList = false;
        $timeout(function () {
            // Toggle list again
            $scope.showList = true;
        }, 1000);

    }

    // Helper function for formatting numbers with leading zeros
    $scope.pad = function (n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n :
        new Array(width - n.length + 1).join(z) + n;
    };

    $scope.downloadDoc = function (doc) {
        window.open('index.php/home/UserHomeController/download?lpath=' +
                    doc.lpath, '_blank');
    };

    $scope.downloadAll = function () {
        // Bits of pre-processing before passing objects to URL
        var paths = [];
        angular.forEach($scope.docs, function (doc) {
            paths.push(doc.lpath);
        });
        location.href = 'index.php/home/UserHomeController/' +
                        'downloadAll?docs=' + JSON.stringify(paths);
    };

    $scope.openMenu = function () {
        $mdSidenav('left').toggle();
    };

    $scope.showHelp = function () {
        var options = {
            showNavigation: true,
            showCloseBox: true,
            delay: -1,
            tripTheme: "dark",
            prevLabel: "Anterior",
            nextLabel: "Siguiente",
            finishLabel: "Entendido"
        };
        if ($scope.docs.length == 0) {
            // User has not selected any request yet, tell him to do it.
            showSidenavHelp(options);
        } else {
            // Guide user through request selection's possible actions
            showRequestHelp(options);
        }
    };

    /**
     * Shows tour-based help of side navigation panel
     * @param options: Obj containing tour.js options
     */
    function showSidenavHelp(options) {
        var responsivePos = $mdMedia('xs') ? 'n' : 'w';

        if ($mdSidenav('left').isLockedOpen() && $scope.requests.length > 0) {
            options.showHeader = true;
            var tripToShowNavigation = new Trip([
                {
                    sel: $("#requests-list"),
                    content: "Seleccione alguna de sus solicitudes en la " +
                             "lista para ver más detalles.",
                    position: "e", expose: true,
                    header: "Panel de navegación", animation: 'fadeInUp'
                },
                {
                    sel: $("#new-req-fab"),
                    content: "También puede crear una solicitud haciendo " +
                             "click aquí",
                    position: responsivePos, expose: true, header: "Crear solicitud",
                    animation: 'fadeInUp'
                }
            ], options);
            tripToShowNavigation.start();
        } else if ($scope.requests.length > 0) {
            var tripToShowNavigation = new Trip([
                {
                    sel: $("#nav-panel"),
                    content: "Haga click en el ícono para abrir el panel " +
                             "de navegación y seleccionar alguna de sus " +
                             "solicitudes para ver más detalles",
                    position: "s", animation: 'fadeInUp'
                },
                {
                    sel: $("#new-req-fab"),
                    content: "También puede crear una solicitud haciendo " +
                             "click aquí",
                    position: responsivePos, expose: true, header: "Crear solicitud",
                    animation: 'fadeInUp'
                }
            ], options);
            tripToShowNavigation.start();
        } else {
            options.showHeader = true;
            var tripToShowNavigation = new Trip([
                {
                    sel: $("#new-req-fab"),
                    content: "Para crear una solicitud haga click aquí",
                    position: responsivePos, expose: true, header: "Crear solicitud",
                    animation: 'fadeInUp'
                }
            ], options);
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
        // options.showSteps = true;
        var tripToShowNavigation = new Trip([
            // Request summary information
            {
                sel: $("#request-summary"),
                content: "Aquí se muestra " +
                         "información acerca de la fecha de creación, monto " +
                         "solicitado por usted, y un posible comentario.",
                position: "s", header: "Resumen de la solicitud",
                expose: true
            },
            // Request status information
            {
                sel: $("#request-status-summary"),
                content: "Esta sección " +
                         "provee información acerca del estatus de su solicitud.",
                position: "s", header: "Resumen de estatus",
                expose: true, animation: 'fadeInDown'
            },
            // Request documents information
            {
                sel: $("#request-docs"),
                content: "Éste y los siguientes " +
                         "items contienen el nombre y una posible descripción de " +
                         "cada documento en su solicitud. Puede verlos/descargarlos " +
                         "haciendo click encima de ellos.",
                position: "s", header: "Documentos", expose: true,
                animation: 'fadeInDown'
            },
            {
                // Download as zip information
                sel: $("#request-summary-actions"),
                content: "También puede " +
                         "descargar todos los documentos haciendo click aquí.",
                position: responsivePos, header: "Descargar todo", expose: true,
                animation: 'fadeInLeft'
            }
        ], options);
        tripToShowNavigation.start();
    }
}

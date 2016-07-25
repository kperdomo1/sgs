<!-- Header -->
<md-toolbar layout-padding>
    <div layout layout-align="center center" class="md-toolbar-tools">
        <h1 class="md-headline">
            <span>Sistema de Gestión de Documentos de Préstamo</span>
        </h1>
    </div>
</md-toolbar>
<!-- Content -->
<main class="main-w-footer">
    <div ng-hide="recovery.recoveryView" layout="column" layout-align="center center">
        <h1 class="md-title" style="font-weight:300">Todos tus documentos. Un solo lugar.</h1>
        <h2 class="md-subhead">Inicie sesión para ingresar al sistema</h2>
    </div>
    <div ng-show="recovery.recoveryView" layout="column" layout-align="center center">
    	<h5 style="font-weight:300">Sistema de recuperación de contraseña</h5>
        <h5>Para cambiar tu contraseña, ingresa tu login y contesta la pregunta de seguridad</h6>
    </div>
    <md-content>
        <div layout="column" layout-align="center center" style="background:#F5F5F5">
            <md-card class="login-card">
                <md-card-title layout layout-align="center center">
                    <md-card-title-media>
                        <div class="md-media-lg card-media">
                            <img ng-src="{{loginImagePath}}" class="md-avatar" alt="Login Image">
                        </div>
                    </md-card-title-media>
                </md-card-title>
                <md-card-content>
                    <div layout>
                        <md-input-container class="md-block" flex="60" flex-offset="20">
                            <label>Cédula</label>
                            <md-icon>account_circle</md-icon>
                            <input type="text" ng-model="model.login" ng-keyup="$event.keyCode == 13 && login()">
                        </md-input-container>
                    </div>
                    <div layout>
                        <md-input-container class="md-block" flex="60" flex-offset="20">
                            <label>Contraseña</label>
                            <md-icon>lock</md-icon>
                            <input type="password" ng-model="model.password" ng-keyup="$event.keyCode == 13 && login()">
                        </md-input-container>
                    </div>
                    <div layout layout-align="center center">
                        <span style="color:red">{{model.loginError}}</span>
                    </div>
                    <div ng-hide="loading" layout layout-align="center center">
                        <md-button ng-click="login()" class="md-raised md-primary">Iniciar sesión</md-button>
                    </div>
                    <div ng-show="loading" layout layout-align="center center">
                        <md-progress-circular md-mode="indeterminate"></md-progress-circular>
                    </div>
                    <br/>
                </md-card-content>
            </md-card>

        </div>
    </md-content>
</main>
<md-divider></md-divider>
<footer>
    <div layout layout-align="space-around center">
        <md-button class="md-accent" href="https://github.com/kperdomo1/sgdp" target="_blank">GitHub</md-button>
        <p class="md-body-1">Creado por Kristopher Perdomo</p>
        <md-button class="md-accent" href="http://www.ipapedi.com" target="_blank">IPAPEDI</md-button>
    </div>
</footer>
</body>
</html>

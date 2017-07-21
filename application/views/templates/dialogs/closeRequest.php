<md-dialog aria-label="Close Request">
    <div layout layout-align="center center" layout-padding>
        <md-input-container md-no-float>
            <input
                type="text"
                required
                md-auto-focus
                ng-keyup="$event.keyCode == 13 && saveEdition()"
                ng-model="comment"
                placeholder="Indique razón de cierre"/>
        </md-input-container>
        <md-button aria-label="send" class="md-icon-button" ng-disabled="missingField()" ng-click="saveEdition()">
            <md-icon ng-if="!uploading">send</md-icon>
            <md-progress-circular
                ng-if="uploading"
                md-mode="indeterminate"
                md-diameter="30">
            </md-progress-circular>
        </md-button>
    </div>
</md-dialog>
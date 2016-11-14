/**
 * Created by igor on 14.11.16.
 */

"use strict";

import routes from 'ui/routes';
import template from 'plugins/cti/views/management/ctiSection.html';

routes.when('/management/kibana/cti', {
    template,
    controller($scope, $window) {
        $scope.conf = {
            useWebPhone: localStorage.getItem("useWebPhone") == 'true',
            useWebRTC: localStorage.getItem("useWebRTC") == 'true',
            leftPosition: localStorage.getItem("leftPosition") == 'true'
        };

        $scope.$watchCollection('conf', (newVal, oldVal) => {
            localStorage.setItem('useWebPhone', $scope.conf.useWebPhone || false);
            localStorage.setItem('useWebRTC', $scope.conf.useWebRTC || false);
            localStorage.setItem('leftPosition', $scope.conf.leftPosition || false);
        });

        $scope.save = () => {
            $window.location.reload();
        }
    }
});
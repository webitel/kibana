/**
 * Created by igor on 12.06.16.
 */

define(function (require) {
    const _ = require('lodash');

    require('ui/routes')
        .when('/settings/cti', {
            template: require('plugins/kibana/settings/sections/cti/cti.html')
        });

    require('ui/modules').get('apps/cti')
        .controller('settingsCti', function ($scope) {
            $scope.useWebPhone = localStorage.getItem("useWebPhone") == 'true';
            $scope.useWebRTC = localStorage.getItem("useWebRTC") == 'true';
            $scope.leftPosition = localStorage.getItem("leftPosition") == 'true';
            $scope.$watchCollection('[useWebPhone,useWebRTC,leftPosition]', function () {
                localStorage.setItem('useWebPhone', $scope.useWebPhone || false);
                localStorage.setItem('useWebRTC', $scope.useWebRTC || false);
                localStorage.setItem('leftPosition', $scope.leftPosition || false);
            })
        });

    return {
        order: 1000,
        name: 'cti',
        display: 'CTI',
        url: '#/settings/cti'
    };
});

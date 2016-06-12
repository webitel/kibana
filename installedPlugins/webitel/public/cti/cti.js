require('plugins/webitel/cti/ctiPanel');

// define(function (require) {
//     const _ = require('lodash');
//
//     require('ui/routes')
//         .when('/settings/cti', {
//             template: require('plugins/kibana/settings/sections/about/index.html')
//         });
//
//     require('ui/modules').get('apps/cti')
//         .controller('settingsCti', function ($scope, kbnVersion, buildNum, buildSha) {
//             $scope.kbnVersion = kbnVersion;
//             $scope.buildNum = buildNum;
//             $scope.buildSha = buildSha;
//         });
//
//     return {
//         order: Infinity,
//         name: 'cti',
//         display: 'CTI',
//         url: '#/settings/cti'
//     };
// });
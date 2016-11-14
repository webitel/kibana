import { resolve } from 'path';

export default function (kibana) {
    return new kibana.Plugin({
        id: 'cti',
        require: ['webitel_main'],
        configPrefix: 'webitel.cti',
        publicDir: resolve(__dirname, 'public'),
        uiExports: {
            hacks: [
                'plugins/cti/cti'
            ],
            chromeNavControls: ['plugins/cti/views/anchor'],
            managementSections: ['plugins/cti/views/management']
        },
        config(Joi) {
            return Joi.object({
                enabled: Joi.boolean().default(true)
            }).default()
        },
        init (server) {
            const config = server.config();
        }
    })
}

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
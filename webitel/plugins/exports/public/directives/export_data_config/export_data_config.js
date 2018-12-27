/**
 * Created by igor on 08.11.16.
 */

"use strict";

const module = require('ui/modules').get('kibana/webitel/exports');
require('plugins/exports/services/export_data_service');
import { toastNotifications } from 'ui/notify';

const template = require('plugins/exports/directives/export_data_config/export_data_config.html');

module.directive('exportDataConfig', () => {
    return {
        restrict: 'E',
        scope: {},
        require: ['?^discoverApp'],
        template,
        link($scope) {
        },
        controller ($scope, webitelExportDataService, Notifier) {
            const notify = new Notifier({
                location: 'Export'
            });
            $scope.export =  (type) => {
                const disc = $scope.$parent.$parent;
                webitelExportDataService.export(disc.searchSource,
                    {
                        to: type,
                        columns: type === 'file' ? ["recordings.hash", "recordings.content-type", "recordings.name", "variables.uuid"] :_.clone(disc.state.columns)
                    }, (e, res) => {
                        if (e) {
                            toastNotifications.addDanger(`Error: ${e.message}`);
                        } else {
                            toastNotifications.addSuccess(`Process started`);
                        }
                    });

            };
        }
    }
});

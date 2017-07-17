/**
 * Created by igor on 14.11.16.
 */

"use strict";

import { management } from 'ui/management';
import routes from 'ui/routes';

import 'plugins/cti/views/management/ctiSection';

routes.defaults(/\/management/, {
    resolve: {
        ctiManagementSection: function (Private) {
            const kibanaManagementSection = management.getSection('kibana');
            kibanaManagementSection.deregister('cti');

            return kibanaManagementSection.register('cti', {
                order: 15,
                display: 'CTI',
                url: '#/management/kibana/cti'
            });
        }
    }
});
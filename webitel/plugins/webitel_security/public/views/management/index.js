import 'plugins/webitel_security/views/management/page_routes';

import {
    management,
    PAGE_SUBTITLE_COMPONENT,
    PAGE_TITLE_COMPONENT,
    registerSettingsComponent,
    // @ts-ignore
} from 'ui/management';
// @ts-ignore
import routes from 'ui/routes';

const MANAGE_SECURITY_KEY = 'security_spaces';

routes.defaults(/\/management/, {
    resolve: {
        securitySpaceManagementSection: function(Private) {
            const kibanaManagementSection = management.getSection('kibana');
            kibanaManagementSection.deregister(MANAGE_SECURITY_KEY);

            return kibanaManagementSection.register(MANAGE_SECURITY_KEY, {
                // name: 'securitySpaceManagementLink',
                order: 11,
                display: 'Security space',
                url: `#/management/security_spaces/list`,
            });
        }
    },
});
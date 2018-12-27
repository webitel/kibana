/**
 * Created by igor on 14.11.16.
 */

"use strict";

import { management } from 'ui/management';
import routes from 'ui/routes';

import 'plugins/webitel_reporting/views/management/reportingSection';
import 'plugins/webitel_reporting/views/management/emailSection';
import 'plugins/webitel_reporting/views/management/job';

routes.defaults(/\/management/, {
    resolve: {
        reportingManagementSection: function (Private) {
            const kibanaManagementSection = management.getSection('kibana');
            kibanaManagementSection.deregister('reporting');

            // kibanaManagementSection.register('email_jobs', {
            //   order: 30,
            //   display: 'Email',
            //   url: '#/management/kibana/email'
            // });

            return kibanaManagementSection.register('reporting', {
                order: 20,
                display: 'Reporting',
                url: '#/management/kibana/reporting'
            })
        },
        emailManagementSection: function (Private) {
          const kibanaManagementSection = management.getSection('kibana');
          kibanaManagementSection.deregister('email');

          return kibanaManagementSection.register('email', {
            order: 30,
            display: 'Email',
            url: '#/management/kibana/email'
          });
        }
    }
});

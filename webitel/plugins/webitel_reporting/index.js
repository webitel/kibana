import { resolve } from 'path';
import initApi from './server/routes/api/v1/jobs';

export const webitel_reporting = (kibana) => {
    return new kibana.Plugin({
        id: 'webitel_reporting',
        require: ['webitel_main', 'elasticsearch'],
        configPrefix: 'webitel.reporting',
        publicDir: resolve(__dirname, 'public'),
        uiExports: {
            managementSections: ['plugins/webitel_reporting/views/management/management'],
            navbarExtensions: [
                'plugins/webitel_reporting/controls/visualize'
            ],
            inspectorViews: [
              'plugins/webitel_reporting/spy_report/spy_report'
            ]
        },
        config(Joi) {
            return Joi.object({
                enabled: Joi.boolean().default(true)
            }).default()
        },
        init (server) {
            initApi(server);
        }
    })
};

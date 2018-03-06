import { resolve } from 'path';
import initApi from './server/routes/api/v1/jobs';

export default function (kibana) {
    return new kibana.Plugin({
        id: 'reporting',
        require: ['webitel_main', 'elasticsearch'],
        configPrefix: 'webitel.reporting',
        publicDir: resolve(__dirname, 'public'),
        uiExports: {
            managementSections: ['plugins/reporting/views/management/management'],
            spyModes: [
              'plugins/reporting/spy_report/spy_report'
            ]
        },
        config(Joi) {
            return Joi.object({
                enabled: Joi.boolean().default(true)
            }).default()
        },
        init (server) {
            const config = server.config();
            initApi(server);
        }
    })
}

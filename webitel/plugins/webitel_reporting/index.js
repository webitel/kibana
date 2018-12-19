import { resolve } from 'path';

export const webitel_reporting = (kibana) => {
    return new kibana.Plugin({
        id: 'webitel_reporting',
        require: ['kibana', 'elasticsearch', 'webitel_main'],
        configPrefix: 'webitel.reporting',
        uiExports: {
            shareContextMenuExtensions: [
                'plugins/webitel_reporting/share_context_menu/register_pdf_reporting'
            ]
        },
        publicDir: resolve(__dirname, 'public'),
        config(Joi) {
            return Joi.object({
                enabled: Joi.boolean().default(true)
            }).default()
        },
        async init (server) {
        }
    })
};
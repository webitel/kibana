/**
 * Created by igor on 04.11.16.
 */


import {Client} from './server/lib/create_client';
import { resolve } from 'path';

export const webitelMain = (kibana) => {
    return new kibana.Plugin({
        id: 'webitel_main',
        require: ['elasticsearch'],
        configPrefix: 'webitel.main',
        uiExports: {
            hacks: [
                'plugins/webitel_main/logo/logo',
            ]
        },
        publicDir: resolve(__dirname, 'public'),
        config(Joi) {
            return Joi.object({
                enabled: Joi.boolean().default(true),
                engineUri: Joi.string().default('http://localhost'),
                engineAuthUri: Joi.string(),
                cdrUri: Joi.string().default('http://localhost/cdr'),
                webRtcUri: Joi.string().default('http://localhost:8082')
            }).default()
        },
        init (server) {
           const config = server.config();
           server.app.webitel = new Client(config);
        }
    })
};
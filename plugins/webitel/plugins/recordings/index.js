/**
 * Created by igor on 07.11.16.
 */

"use strict";
import { resolve } from 'path';
import initRecordingsApi from './server/routes/api/v1/recordings';

export default function (kibana) {
    return new kibana.Plugin({
        id: 'recordings',
        require: ['webitel_main'],
        configPrefix: 'webitel.recordings',
        publicDir: resolve(__dirname, 'public'),
        uiExports: {
            hacks: [
                'plugins/recordings/doc_views/recordings_tab'
            ]
        },
        config(Joi) {
            return Joi.object({
                enabled: Joi.boolean().default(true)
            }).default()
        },
        init (server) {
            const config = server.config();
            
            initRecordingsApi(server);
        }
    })
}
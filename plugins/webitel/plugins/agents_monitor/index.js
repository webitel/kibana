/**
 * Created by igor on 07.11.16.
 */

"use strict";
import { resolve } from 'path';

export default function (kibana) {
    return new kibana.Plugin({
        id: 'agents_monitor',
        require: ['webitel_main'],
        configPrefix: 'webitel.agents_monitor',
        publicDir: resolve(__dirname, 'public'),
        uiExports: {
            visTypes: [
                'plugins/agents_monitor/agents_monitor'
            ]
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

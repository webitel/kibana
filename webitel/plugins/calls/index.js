/**
 * Created by igor on 07.11.16.
 */

"use strict";
import { resolve } from 'path';

export const calls = (kibana) => {
    return new kibana.Plugin({
        id: 'calls',
        require: ['webitel_main'],
        configPrefix: 'webitel.calls',
        publicDir: resolve(__dirname, 'public'),
        uiExports: {
            visTypes: [
                'plugins/calls/calls'
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
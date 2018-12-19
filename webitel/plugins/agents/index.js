/**
 * Created by igor on 07.11.16.
 */

"use strict";
import { resolve } from 'path';

export const agents = (kibana) => {
    return new kibana.Plugin({
        id: 'agents',
        require: ['webitel_main'],
        configPrefix: 'webitel.agents',
        publicDir: resolve(__dirname, 'public'),
        uiExports: {
            visTypes: [
                'plugins/agents/agents'
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
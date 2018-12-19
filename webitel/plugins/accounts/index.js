/**
 * Created by igor on 07.11.16.
 */

"use strict";
import { resolve } from 'path';

export const accounts = (kibana) => {
    return new kibana.Plugin({
        id: 'accounts',
        require: ['webitel_main'],
        configPrefix: 'webitel.accounts',
        publicDir: resolve(__dirname, 'public'),
        uiExports: {
            visTypes: [
                'plugins/accounts/accounts'
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
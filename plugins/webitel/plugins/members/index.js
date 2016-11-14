/**
 * Created by igor on 08.11.16.
 */

"use strict";
import { resolve } from 'path';

export default function (kibana) {
    return new kibana.Plugin({
        id: 'members',
        require: ['webitel_main'],
        configPrefix: 'webitel.members',
        publicDir: resolve(__dirname, 'public'),
        uiExports: {
            visTypes: [
                'plugins/members/members'
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
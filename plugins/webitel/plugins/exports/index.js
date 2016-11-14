/**
 * Created by igor on 07.11.16.
 */

"use strict";
import { resolve } from 'path';

export default function (kibana) {
    return new kibana.Plugin({
        id: 'exports',
        require: ['webitel_main', 'recordings'],
        configPrefix: 'webitel.exports',
        publicDir: resolve(__dirname, 'public'),
        uiExports: {
            navbarExtensions: [
                'plugins/exports/controls/discover'
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
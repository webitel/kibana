/**
 * Created by igor on 04.11.16.
 */


import Client from './server/lib/create_client';
import { resolve } from 'path';

export const webitel_main = (kibana) => {
    return new kibana.Plugin({
        id: 'webitel_main',
        require: ['elasticsearch'],
        configPrefix: 'webitel.main',
        uiExports: {
            hacks: [
                'plugins/webitel_main/logo',
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
        async init (server) {
           const client = new Client(server);
           server.expose('webitelClient', client);

           // try {
           //     const res = await client.api('GET', '/api/v2/status', null, {
           //         "x-key": "6793771f-e8f5-4b73-ba2a-41567bdd8d73",
           //         "x-access-token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1NTEwMDAzODkyNTcsImFjbCI6eyJjZHIiOlsiKiJdLCJjZHIvZmlsZXMiOlsiKiJdLCJjZHIvbWVkaWEiOlsiKiJdfX0.bfSDMd7nJMEpbtKHidPpdPwx6qDetAezZ1CfBiVxMa4"
           //     });
           //     // console.dir(res)
           // } catch (e) {
           //     console.dir(e)
           // }
        }
    })
};
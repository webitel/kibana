/**
 * Created by igor on 04.11.16.
 */

import { get } from 'lodash';

export default (server) => {
    const login = server.getHiddenUiAppById('login');

    server.route({
        method: 'GET',
        path: '/login',
        handler(request, reply) {
            return reply.renderAppWithDefaultConfig(login);
        },
        config: {
            auth: false
        }
    });
}

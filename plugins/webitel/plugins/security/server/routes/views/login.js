/**
 * Created by igor on 04.11.16.
 */

"use strict";
import { get } from 'lodash';

export default (server, uiExports) => {
    const login = uiExports.apps.byId.login;
    const config = server.config();

    server.route({
        method: 'GET',
        path: '/login',
        handler(request, reply) {
            if (request.auth.isAuthenticated) {
                const next = get(request, 'query.next', '/');
                return reply.redirect(`${config.get('server.basePath')}${next}`);
            }

            return reply.renderAppWithDefaultConfig(login);
        },
        config: {
            auth: false
        }
    });
}
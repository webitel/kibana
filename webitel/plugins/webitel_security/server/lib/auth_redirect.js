
import Boom from 'boom';
import { wrapError } from './errors';

export function authenticateFactory(server) {
    return async function authenticate(request, reply) {

        let authenticationResult;
        try {
            authenticationResult = await server.plugins.webitel_security.authenticate(request);
        } catch(err) {
            server.log(['error', 'authentication'], err);
            reply(wrapError(err));
            return;
        }

        if (authenticationResult.succeeded()) {
            reply.continue({ credentials: authenticationResult.user });
        } else if (authenticationResult.redirected()) {
            // Some authentication mechanisms may require user to be redirected to another location to
            // initiate or complete authentication flow. It can be Kibana own login page for basic
            // authentication (username and password) or arbitrary external page managed by 3rd party
            // Identity Provider for SSO authentication mechanisms. Authentication provider is the one who
            // decides what location user should be redirected to.
            reply.redirect(authenticationResult.redirectURL);
        } else if (authenticationResult.failed()) {
            server.log(['info', 'authentication'], `Authentication attempt failed: ${authenticationResult.error.message}`);
            reply(wrapError(authenticationResult.error));
        } else {
            reply(Boom.unauthorized());
        }
    };
}
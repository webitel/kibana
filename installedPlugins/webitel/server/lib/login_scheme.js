import { set } from 'lodash';
import { isBoom, isInvalidCookie, isUnauthorized } from './errors';
import authenticateFactory from './auth_redirect';

/**
 * Creates a hapi auth scheme with conditional session
 * expiration handling based on each request
 *
 * @param {object}
 *    redirectUrl: Transform function that request path is passed to before
 *                 redirecting
 *    strategy:    The name of the auth strategy to use for test
 * @return {Function}
 */
export default function createScheme({ redirectUrl, strategy }) {
  return (server, options) => {
    const authenticate = authenticateFactory({
      onError: setExpirationMessage,
      redirectUrl,
      strategy,
      testRequest: server.auth.test
    });
    return { authenticate };
  };
}

export function setExpirationMessage(err) {
  // hapi-auth-cookie's default behavior is to reject expired sessions with an
  // "invalid cookie" 401, so we add a more friendly error message
  if (isBoom(err) && isInvalidCookie(err) && isUnauthorized(err)) {
    set(err, 'output.payload.message', 'Session has expired');
  }
  return err;
}

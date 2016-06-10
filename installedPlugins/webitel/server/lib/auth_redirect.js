import { includes } from 'lodash';

/**
 * Creates a hapi authenticate function that conditionally
 * redirects on auth failure
 *
 * It's a little rudimentary, but it'll redirect any requests that accept html
 * responses and will otherwise defer to the standard error handler.
 *
 * @param {object}
 *    onError:     Transform function that error is passed to before deferring
 *                 to standard error handler
 *    redirectUrl: Transform function that request path is passed to before
 *                 redirecting
 *    strategy:    The name of the auth strategy to use for test
 *    testRequest: Function to test authentication for a request
 * @return {Function}
 */
export default function factory({ onError, redirectUrl, strategy, testRequest }) {
  return function authenticate(request, reply) {
    console.log('auth ', request.session);
    testRequest(strategy, request, (err, credentials) => {
      if (err) {
        if (shouldRedirect(request.raw.req)) {
          reply.redirect(redirectUrl(request.url.path));
        } else {
          reply(onError(err));
        }
      } else {
        reply.continue({ credentials });
      }
    });
  };
};

export function shouldRedirect(req) {
  return includes(req.headers.accept, 'html');
};

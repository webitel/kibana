import { includes } from 'lodash';
import url from 'url'
import {validateIndex} from "./create_index";
const Boom = require('boom');

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
    testRequest(strategy, request, (err, credentials) => {
      if (err) {
        if (shouldRedirect(request.raw.req)) {
          if (~request.raw.req.url.indexOf('access_token') && ~request.raw.req.url.indexOf('x_key')) {
            validateAccess(request.raw.req.url, request.server.app.webitel, (err, credentials) => {
              if (err) {
                request.auth.session.clear();
                return reply(Boom.unauthorized(err));
              }

              request.server.app.cache.set(credentials.key, credentials, 0, (err) => {

                if (err) {
                  request.server.log(['status', 'error', 'security'], err.message);
                  return reply(Boom.unauthorized(err));
                }
                request.auth.session.set({ sid: credentials.key });
                if (credentials.domain)
                  validateIndex(request.server, credentials.domain);

                reply.continue({ credentials });
              });
            });
          } else {
            reply.redirect(redirectUrl(request.url.path));
          }
        } else {
          reply(onError(err));
        }
      } else {
        reply.continue({ credentials });
      }
    });
  };
};

export function validateAccess(link, webitel, cb) {
  let _url = link;
  if (link[1] === "#") {
    _url = link.substring(2);
  }
  const query = url.parse(_url, true).query;
  webitel.api('GET', `/api/v2/whoami?access_token=${query.access_token}&x_key=${query.x_key}`, null, (err , res, data) => {
    if (err)
      return cb(err);

    if (res.statusCode !== 200) {
      return cb(new Error("Unauthorized"))
    }
    let credentials;
    try {
      credentials = JSON.parse(data)
    } catch (e) {
      return cb(e)
    }
    credentials.key = query.x_key;
    credentials.token = query.access_token;

    return cb(null, credentials)

  })

}

export function shouldRedirect(req) {
  return includes(req.headers.accept, 'html');
}

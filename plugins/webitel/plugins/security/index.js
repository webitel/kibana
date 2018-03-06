/**
 * Created by igor on 04.11.16.
 */

"use strict";

import { resolve } from 'path';
import initLoginView from './server/routes/views/login';
import initLogoutView from './server/routes/views/logout';
import initAuthenticateApi from './server/routes/api/v1/authenticate';
import createScheme from './server/lib/login_scheme';
import hapiAuthCookie from 'hapi-auth-cookie';

export default (kibana) => {
  return new kibana.Plugin({
    id: "security",
    require: ['webitel_main', 'kibana', 'elasticsearch'],
    publicDir: resolve(__dirname, 'public'),
    configPrefix: 'webitel.security',
    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        cookieName: Joi.string().default('sid'),
        encryptionKey: Joi.string().default('blablablablablablablablablablablablablablablablablablablablabla'),
        sessionTimeout: Joi.number().default(2147483647),
        secureCookies: Joi.boolean().default(false),
        userName: Joi.string(),
        password: Joi.string()
      }).default();
    },

    uiExports: {
      chromeNavControls: ['plugins/security/views/logout_button/logout_button'],
      apps: [
        {
          id: 'login',
          title: 'Login',
          main: 'plugins/security/views/login/login',
          hidden: true
        },
        {
          id: 'logout',
          title: 'Logout',
          main: 'plugins/security/views/logout/logout',
          hidden: true
        }
      ]
    },

    injectDefaultVars(server) {
      return {}
    },
    init(server) {
      const plugin = this;
      const config = server.config();

      server.register(hapiAuthCookie, (error) => {
        if (error != null) throw error;

        const cache = server.cache({segment: 'sessions', expiresIn: config.get('webitel.security.sessionTimeout')});
        server.app.cache = cache;

        server.auth.scheme('login', createScheme({
          redirectUrl: (path) => loginUrl(config.get('server.basePath'), path),
          strategy: 'webitel'
        }));
        server.auth.strategy('session', 'login', 'required');

        server.auth.strategy('webitel', 'cookie', false, {
          password: config.get('webitel.security.encryptionKey'),
          cookie: config.get('webitel.security.cookieName'),
          redirectTo: '/login',
          isSecure: false,
          validateFunc: function (request, session, callback) {
            cache.get(session.sid, (err, cached) => {

              if (err) {
                server.log(['status', 'error', 'security'], err.message);
                return callback(err, false);
              }

              if (!cached) {
                return callback(null, false);
              }

              return callback(null, true, cached);
            });
          }
        });

      });

      initAuthenticateApi(server);
      initLoginView(server, plugin);
      initLogoutView(server, plugin);
    }
  });
}

function loginUrl(baseUrl, requestedPath) {
    const next = encodeURIComponent(requestedPath);
    return `${baseUrl}/login?next=${next}`;
}

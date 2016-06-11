
const hapiAuthCookie = require('hapi-auth-cookie');
const root = require('requirefrom')('');
const validateConfig = root('server/lib/validate_config');
const createScheme = root('server/lib/login_scheme').default;
import {Client} from './server/lib/client';

module.exports = (kibana) => new kibana.Plugin({
  name: 'webitel',
  require: ['elasticsearch'],

  config(Joi) {
    return Joi.object({
      enabled: Joi.boolean().default(true),
      sid: Joi.string().default('sid'),
      engineUri: Joi.string().default('http://localhost'),
      encryptionKey: Joi.string(),
      sessionTimeout: Joi.number().default(30 * 60 * 1000),
      // Only use this if SSL is still configured, but it's configured outside of the Kibana server
      // (e.g. SSL is configured on a load balancer)
      skipSslCheck: Joi.boolean().default(false)
    }).default()
  },

  uiExports: {
    chromeNavControls: ['plugins/webitel/views/logout_button'],
    visTypes: ['plugins/webitel/iframe'],
    apps: [{
      id: 'login',
      title: 'Login',
      main: 'plugins/webitel/views/login',
      hidden: true,
      autoload: kibana.autoload.styles
    }, {
      id: 'logout',
      title: 'Logout',
      main: 'plugins/webitel/views/logout',
      hidden: true,
      autoload: kibana.autoload.styles
    }]
  },

  init(server, options) {
    const config = server.config();
    validateConfig(config);

    server.register(hapiAuthCookie, (error) => {
      if (error != null) throw error;

      const cache = server.cache({ segment: 'sessions', expiresIn: config.get('webitel.sessionTimeout') });
      server.app.cache = cache;

      server.auth.scheme('login', createScheme({
        redirectUrl: (path) => loginUrl(config.get('server.basePath'), path),
        strategy: 'webitel'
      }));
      server.auth.strategy('session', 'login', 'required');

      server.auth.strategy('webitel', 'cookie', false, {
        password: config.get('webitel.encryptionKey'),
        cookie: config.get('webitel.sid'),
        redirectTo: '/login',
        isSecure: config.get('webitel.skipSslCheck'),
        validateFunc: function (request, session, callback) {
          console.log('validate', session);
          cache.get(session.sid, (err, cached) => {

            if (err) {
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

    server.app.webitel = new Client(config);
    console.log(server.webitel);
    root('server/routes/api/v1/authenticate')(server);
    root('server/routes/views/login')(server, this);
    root('server/routes/views/logout')(server, this);
  }
});

function loginUrl(baseUrl, requestedPath) {
  const next = encodeURIComponent(requestedPath);
  return `${baseUrl}/login?next=${next}`;
}

const Boom = require('boom');
const Joi = require('joi');
import {validateIndex} from '../../../lib/createIndex'

module.exports = (server) => {
  const success = {statusCode: 200, payload: 'success'};
  const baseUrl = server.config().get('webitel.engineUri');
  const webRtcUri = server.config().get('webitel.webRtcUri'); //webRtcUri

  const oneUserName = server.config().get('webitel.userName');
  const onePassword = server.config().get('webitel.password');
  const useOneLogin = onePassword && oneUserName;

  server.route({
    method: 'POST',
    path: '/api/webitel/v1/login',
    handler: (request, reply) => {
      const {username, password} = request.payload;

      if (useOneLogin) {
        if (username === oneUserName && password === onePassword) {
          const user = {
            key: oneUserName,
            domain: null
          };
          request.server.app.cache.set(user.key, user, 0, (err) => {
            if (err) {
              reply(Boom.unauthorized(err));
            }
            request.auth.session.set({ sid: user.key });
            reply(success);
          });
        } else {
          request.auth.session.clear();
          reply(Boom.unauthorized(new Error('bad credentials')));
        }

        return;
      }

      request.server.app.webitel.api('POST', '/login', {username: username, password: password}, (err, res, user) => {
        if (err || res.statusCode != 200) {
          request.auth.session.clear();
          return reply(Boom.unauthorized(err));
        }
        user.password = password;
        request.server.app.cache.set(user.key, user, 0, (err) => {
          if (err) {
            reply(Boom.unauthorized(err));
          }
          request.auth.session.set({ sid: user.key });
          if (user.domain)
              validateIndex(server, user.domain);
          reply(success);
        });
      });

    },
    config: {
      auth: { mode: 'try' },
      plugins: { 'hapi-auth-cookie': { redirectTo: false } },
      validate: {
        payload: {
          username: Joi.string().required(),
          password: Joi.string().required()
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/api/webitel/v1/whoami',
    handler(request, reply) {
      return reply({statusCode: 200, credentials: request.auth.credentials, engineUri: baseUrl, webRtcUri: webRtcUri});
    }
  });

  server.route({
    method: 'POST',
    path: '/api/webitel/v1/logout',
    handler(request, reply) {
      request.auth.session.clear();
      return reply(success);
    },
    config: {
      auth: false
    }
  });
};

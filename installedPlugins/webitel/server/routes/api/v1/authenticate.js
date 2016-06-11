const Boom = require('boom');
const Joi = require('joi');
import {validateIndex} from '../../../lib/createIndex'

module.exports = (server) => {
  const success = {statusCode: 200, payload: 'success'};

  server.route({
    method: 'POST',
    path: '/api/webitel/v1/login',
    handler: (request, reply) => {
      const {username, password} = request.payload;

      request.server.app.webitel.api('POST', '/login', {username: username, password: password}, (err, res, user) => {
        if (err || res.statusCode != 200) {
          request.auth.session.clear();
          return reply(Boom.unauthorized(err));
        }
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

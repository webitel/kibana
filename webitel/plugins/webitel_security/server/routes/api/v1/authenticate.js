import { wrapError } from '../../../lib/errors';
import Joi from 'joi';

module.exports = (server) => {
  const baseUrl = server.config().get('webitel.main.engineUri');
  const webRtcUri = server.config().get('webitel.main.webRtcUri');

  server.route({
      method: 'POST',
      path: '/api/webitel/v1/login',
      config: {
          auth: false,
          validate: {
              payload: {
                  username: Joi.string().required(),
                  password: Joi.string().required()
              }
          },
          response: {
              emptyStatusCode: 204
          }
      },
      async handler(request, reply) {
          try {
              const credentials = await server.plugins.webitel_security.login(request);

              return reply.continue({ credentials });
          } catch (err) {
              return reply(wrapError(err));
          }
      }
  });

  server.route({
    method: 'GET',
    path: '/api/webitel/v1/whoami',
    async handler(request, reply) {
      const credentials = await server.plugins.webitel_security.getUser(request);
      return reply({
        statusCode: 200,
        credentials: credentials.whoAMI(),
        engineUri: baseUrl,
        webRtcUri: webRtcUri
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/api/webitel/v1/logout',
    async handler(request, reply) {
        try {
            const result = await server.plugins.webitel_security.deauthenticate(request);
            return reply(result);
        } catch (err) {
            return reply(wrapError(err));
        }
    },
    config: {
      auth: false
    }
  });
};

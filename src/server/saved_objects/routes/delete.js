import Joi from 'joi';

export const createDeleteRoute = (prereqs) => ({
  path: '/api/saved_objects/{type}/{id}',
  method: 'DELETE',
  config: {
    pre: [prereqs.getSavedObjectsClient],
    validate: {
      params: Joi.object().keys({
        type: Joi.string().required(),
        id: Joi.string().required(),
      }).required()
    },
    handler(request, reply) {
      const { savedObjectsClient } = request.pre;
      const { type, id } = request.params;

      /*WEBITEL*/
      if (!request.auth.credentials)
        return reply(new Error('Session unauthorized'));

      reply(savedObjectsClient.delete(type, id, request.auth.credentials.domain));
    }
  }
});

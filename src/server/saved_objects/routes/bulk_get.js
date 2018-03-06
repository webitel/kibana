import Joi from 'joi';

export const createBulkGetRoute = (prereqs) => ({
  path: '/api/saved_objects/bulk_get',
  method: 'POST',
  config: {
    pre: [prereqs.getSavedObjectsClient],
    validate: {
      payload: Joi.array().items(Joi.object({
        type: Joi.string().required(),
        id: Joi.string().required(),
      }).required())
    },
    handler(request, reply) {
      const { savedObjectsClient } = request.pre;

      /*WEBITEL*/
      if (!request.auth.credentials)
        return reply(new Error('Session unauthorized'));

      reply(savedObjectsClient.bulkGet(request.payload, request.auth.credentials.domain));

    }
  }
});

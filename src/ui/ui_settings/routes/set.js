import Joi from 'joi';

async function handleRequest(request) {
  const { key } = request.params;
  const { value } = request.payload;
  const uiSettings = request.getUiSettingsService();

  /*WEBITEL*/
  const domainName = request.auth.credentials && request.auth.credentials.domain;

  await uiSettings.set(key, value, domainName);
  return {
    settings: await uiSettings.getUserProvided(undefined, domainName)
  };
}

export const setRoute = {
  path: '/api/kibana/settings/{key}',
  method: 'POST',
  config: {
    validate: {
      params: Joi.object().keys({
        key: Joi.string().required(),
      }).default(),

      payload: Joi.object().keys({
        value: Joi.any().required()
      }).required()
    },
    handler(request, reply) {
      reply(handleRequest(request));
    }
  }
};

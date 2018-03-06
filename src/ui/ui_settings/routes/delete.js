async function handleRequest(request) {
  const { key } = request.params;
  const uiSettings = request.getUiSettingsService();

  /*WEBITEL*/
  if (!request.auth.credentials) {
    return new Error('Session unauthorized');
  }

  await uiSettings.remove(key, request.auth.credentials.domain);

  return {
    settings: await uiSettings.getUserProvided(undefined, request.auth.credentials.domain)
  };
}

export const deleteRoute = {
  path: '/api/kibana/settings/{key}',
  method: 'DELETE',
  handler(request, reply) {
    reply(handleRequest(request));
  }
};

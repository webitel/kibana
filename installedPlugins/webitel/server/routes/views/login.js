module.exports = (server, uiExports) => {
  const config = server.config();
  const cookieName = config.get('webitel.sid');
  const login = uiExports.apps.byId.login;
  server.route({
    method: 'GET',
    path: '/login',
    handler(request, reply) {
      console.log('get login', request.auth.isAuthenticated);
      if (request.auth.isAuthenticated) return reply.redirect('./');
      return reply.renderApp(login);
    },
    config: {
      auth: false
    }
  });
};

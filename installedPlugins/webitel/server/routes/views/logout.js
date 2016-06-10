module.exports = (server, uiExports) => {
  const logout = uiExports.apps.byId.logout;
  server.route({
    method: 'GET',
    path: '/logout',
    handler(request, reply) {
      return reply.renderApp(logout);
    },
    config: {
      auth: false
    }
  });
};


export default function (server) {

    server.route({
        method: 'GET',
        path: '/api/webitel/v1/roles',
        async handler(request, reply) {
            const { info = {} } = await server.plugins.webitel_security.getRoles(request);
            return reply({
                statusCode: 200,
                roles: info.roles || []
            });
        }
    });
}
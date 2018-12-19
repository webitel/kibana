import { wrapError } from '../../../lib/errors';
import Boom from 'boom';

export default function (server) {

    server.route({
        method: 'PUT',
        path: '/api/webitel/v1/space_security/{id}',
        async handler(request, reply) {
            const { SavedObjectsClient } = server.savedObjects;
            const spacesClient = server.plugins.spaces.spacesClient.getScopedClient(
                request
            );

            const space = request.payload;
            const id = request.params.id;

            let result;
            try {
                result = await spacesClient.update(id, { ...space });
            } catch (error) {
                if (SavedObjectsClient.errors.isNotFoundError(error)) {
                    return reply(Boom.notFound());
                }
                return reply(wrapError(error));
            }

            return reply(result);
        }
    });
}
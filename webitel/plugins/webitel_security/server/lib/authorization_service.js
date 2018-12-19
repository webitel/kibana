
export function createAuthorizationService(server, client, defIndex) {
    const resources = [
        "config",
        "index-pattern",
        "search",
        "dashboard",
        "visualization",
        "canvas-workpad"
    ];
    return {
        resources,
        async checkPrivilegesWithRequest(request, spaceId, resource, action) {

            const _resource = resource.filter(item => ~resources.indexOf(item));
            if (!_resource.length) {
                console.log(`Skip ${resource} `, action);
                return true;
            }
            const user = await server.plugins.webitel_security.getUser(request);

            if (!user) {
                return false;
            }

            if (user.getDomain() === null) {
                return true
            }


            const result = await client.callWithRequest(request, 'get', {
                id: `space:${spaceId}`,
                type: 'doc',
                index: `${defIndex}-${user.getDomain()}`,
                _source: ["space.acl"],
                ignore: [ 404 ]
            });

            if (!result.found)
                return false;

            const { acl = {}} = result._source.space;

            for (let res of resource) {
                if (!acl.hasOwnProperty(res)) {
                    return false;
                }

                if (!~acl[res][action].indexOf(user.getRole())) {
                    return false
                }

            }

            return true;

        }
    }
}
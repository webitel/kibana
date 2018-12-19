/**
 * Created by igor on 10.11.16.
 */

"use strict";


module.exports = server => {
    server.route({
        method: 'GET',
        path: '/api/webitel/v1/recordings/{hash}',
        handler: {
            proxy: {
                mapUri: async (req, cb) => {
                    const headers = {};
                    const user = await server.plugins.webitel_security.getUser(req);

                    //console.log(auth);
                    if (req.headers.hasOwnProperty('range'))
                        headers.range = req.headers.range;

                    if (user) {
                        headers['X-Key'] = user.getAuthKey();
                        headers['X-Access-Token'] = user.getAuthToken();
                        console.dir(headers)
                        return cb(
                            null,
                            `${user.getCdrHost()}/api/v2/files/${req.params.hash}${req.url.search}`,
                            headers
                        )
                    } else {
                        return cb(401);
                    }

                },
                onResponse: (err, res, request, reply, settings, ttl) => {
                    if (err)
                        return reply(err);
                    return reply(res);
                }
            }
        }
    });
};
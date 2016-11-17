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
                mapUri: (req, cb) => {
                    const auth = req.auth.credentials,
                        headers = {
                            authorization: `Base ${auth.baseAuth}`
                        };
                    //console.log(auth);
                    if (req.headers.hasOwnProperty('range'))
                        headers.range = req.headers.range;

                    if (auth) {
                        if (auth.hasOwnProperty('baseAuth')) {
                            return cb(
                                null,
                                `${auth.cdrUri}/api/v1/recordings/${req.params.hash}${req.url.search}`,
                                headers
                            )
                        } else {
                            headers['X-Key'] = auth.key;
                            headers['X-Access-Token'] = auth.token;
                            return cb(
                                null,
                                `${auth.cdr.host}/api/v2/files/${req.params.hash}${req.url.search}`,
                                headers
                            )
                        }
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
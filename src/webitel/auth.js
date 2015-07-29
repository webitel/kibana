/**
 * Created by Admin on 22.07.2015.
 */
var config = require('../config');
var url = require('url').parse(config.webitelAuthUri);
var http = require(url.protocol.replace(':', ''));
var WSS_SERVER = (config.webitelAuthUri || '').replace(/http/, 'ws');

function joinStringFromIndex(x1, x2, i) {
    return x1.slice(0, i) + x2 + x1.slice(i)
};

var auth = {
    validate: function (req, cb) {
        var user = req.session['user'];
        if (!user || !user['expires'] || user['expires'] < new Date().getTime()) {
            return cb(new Error('Session unauthorized'));
        };

        if (user['domain'] &&  req.url.indexOf('/elasticsearch/.kibana') != 0) {
            if (/.\/_mapping\/./i.test(req.url)) {
                req.url = joinStringFromIndex(req.url, user['domain'], req.url.indexOf(/_mapping/));
                console.log(req.url);
            }
            else if (/.\/_msearch\?./i.test(req.url)) {
                req.rawBody = req.rawBody.toString('utf8');
                req.rawBody = req.rawBody.replace(/"index":"([\s\S]*?)"/gi, function (a, b) {
                    return '"index":"' + b + user['domain'] + '"';
                });
            }
        };

        cb(null);
    }, 
    login: function (rawBody, cb) {
        try {
            var postData = rawBody.toString('utf8'),
                jsonBody = JSON.parse(postData);

            if (!jsonBody || !jsonBody['username']) {
                return cb(null, null);
            };

            var options = {
                hostname: url.hostname,
                port: url.port,
                path: '/login',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Length': rawBody.length
                }
            };

            var req = http.request(options, function(res) {
                if (res.statusCode === 401) {
                    return cb(null, null);
                };
                if (res.statusCode !== 200) {
                    return cb(new Error(res.statusCode));
                };
                var chunks = [];
                res.on('data', function (chunk) {
                    chunks.push(chunk);
                });
                
                res.on('end', function () {
                    try {
                        var user = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                        user['ws'] = WSS_SERVER;
                        user['password'] = jsonBody.password;

                        return cb(null, user);
                    } catch (e) {
                        return cb(e);
                    }
                });
            });

            req.on('error', function(e) {
                console.log('problem with request: ' + e.message);
                cb(e);
            });

            req.write(rawBody);
            req.end();
        } catch (e) {
            cb(e);
        };
    }
};
module.exports = auth;
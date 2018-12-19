/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import hapiAuthCookie from 'hapi-auth-cookie';
import LRU from 'lru-cache'

const HAPI_STRATEGY_NAME = 'security-cookie';
// Forbid applying of Hapi authentication strategies to routes automatically.
const HAPI_STRATEGY_MODE = false;

function assertRequest(request) {
    if (!request || typeof request !== 'object') {
        throw new Error(`Request should be a valid object, was [${typeof request}].`);
    }
}

export class Session {

    _server = null;

    _ttl = null;

    constructor(server) {
        this._server = server;
        this._ttl = this._server.config().get('webitel.security.sessionTimeout');
    }

    async get(request) {
        assertRequest(request);

        return new Promise((resolve) => {
            this._server.auth.test(HAPI_STRATEGY_NAME, request, (err, session) => {
                if (Array.isArray(session)) {
                    const warning = `Found ${session.length} auth sessions when we were only expecting 1.`;
                    this._server.log(['warning', 'security', 'auth', 'session'], warning);
                    return resolve(null);
                }

                if (err) {
                    this._server.log(['debug', 'security', 'auth', 'session'], err);
                }

                resolve(err ? null : session.value);
            });
        });
    }

    async set(request, value) {
        assertRequest(request);

        request.cookieAuth.set({
            value,
            expires: this._ttl && Date.now() + this._ttl
        });
    }

    async clear(request) {
        assertRequest(request);

        request.cookieAuth.clear();
    }

    static async create(server) {
        await new Promise((resolve, reject) => {
            server.register(hapiAuthCookie, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        const config =  server.config();
        server.auth.strategy(HAPI_STRATEGY_NAME, 'cookie', HAPI_STRATEGY_MODE, {
            cookie: config.get('webitel.security.cookieName'),
            password: config.get('webitel.security.encryptionKey'),
            clearInvalid: true,
            validateFunc: Session._validateCookie,
            isSecure: config.get('webitel.security.secureCookies'),
            // path: `${config.get('server.basePath')}/`
        });

        return new Session(server);
    }

    static _validateCookie(request, session, callback) {
        if (session.expires && session.expires < Date.now()) {
            console.log("--------------------------ERROR");
            callback(new Error('Session has expired'), false /* isValid */);
            return;
        }

        callback(null /* error */, true /* isValid */, session);
    }
}

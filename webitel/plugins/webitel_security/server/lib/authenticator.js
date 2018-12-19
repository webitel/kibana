import {AuthenticationResult} from './authentication_result'
import AuthClient from './authClient'

import {Session} from './session'
import LRU from "lru-cache";

function assertRequest(request) {
    if (!request || typeof request !== 'object') {
        throw new Error(`Request should be a valid object, was [${typeof request}].`);
    }
}

function getProviderOptions(server) {
    const config = server.config();

    return {
        log: server.log.bind(server),

        protocol: server.info.protocol,
        hostname: config.get('server.host'),
        port: config.get('server.port'),
        basePath: config.get('server.basePath'),
        kIndex: config.get('kibana.index')
    };
}

class Authenticator {
    _server = null;
    _session = null;
    _options = null;
    _service = null;
    _adminCluster = null;

    _cache = null;

    constructor(server, session) {
        this._server = server;
        this._session = session;
        this._options = Object.freeze(getProviderOptions(server));
        this._service = new AuthClient(server);
        this._cache = new LRU({
            max: 0,
            maxAge: 60 * 1000,
        });

        this._adminCluster = server.plugins.elasticsearch.getCluster('admin');
    }

    // async checkPrivilegesWithRequest(request, spaceId, resource, action) {
    //     const result = await this._adminCluster.callWithRequest(request, 'get', {
    //         id: `space:${spaceId}`,
    //         type: 'doc',
    //         index: this._options.kIndex,
    //         ignore: [ 404 ]
    //     });
    //
    //     console.dir(result)
    // }

    async login(request) {
        const {username, password} = request.payload;
        const user = await this._service.loginByCredentials(username, password);

        const session = user.getSession();
        await this._session.set(
            request,
            session
        );
        this._cache.set(session.token, user);
        return session
    }

    async getRoles(request) {
        const existingSession = await this._session.get(request);
        const result = await this._service.getRoles(existingSession.token, existingSession.key);
        return result;
    }

    async authenticate(request) {
        assertRequest(request);
        let authenticationResult;

        const isSystemApiRequest = this._server.plugins.kibana.systemApi.isSystemApiRequest(request);
        const existingSession = await this._session.get(request);
        if (existingSession) {
            if (!this._cache.has(existingSession.token)) {
                console.log("REINVITE");
                try {
                    const user = await this._service.whoAMI(existingSession.token, existingSession.key);
                    this._cache.set(existingSession.token, user);
                } catch (e) {
                    console.error("--------------------------");
                    console.error(e);
                    this._session.clear(request);
                    throw e
                }
            } else {
                console.log("FROM CACHE")
            }
            // console.log(this._cache.get(existingSession.token));

            request.headers['x-domain'] = this._cache.get(existingSession.token).getDomain();
            // console.error(request.headers['x-domain']);

            authenticationResult = AuthenticationResult.succeeded(existingSession)
        } else {
            const nextURL = encodeURIComponent(`${this._options.basePath}${request.url.path}`);
            authenticationResult = AuthenticationResult.redirectTo(
                `${this._options.basePath}/login?next=${nextURL}`
            );
        }

        return authenticationResult
    }

    getUser(request) {
        if (!request.state || !request.state.sid) {
            return null
        }

        return this._cache.get(request.state.sid.value.token)
    }

    async deauthenticate(request) {
        const existingSession = await this._session.get(request);
        const result = await this._service.logout(existingSession.token, existingSession.key);
        this._session.clear(request);
        return result;
    }
}


export async function initAuthenticator(server) {
    const session = await Session.create(server);

    const authenticator = new Authenticator(server, session);
    server.expose('authenticate', (request) => authenticator.authenticate(request));
    server.expose('login', (request) => authenticator.login(request));
    server.expose('deauthenticate', (request) => authenticator.deauthenticate(request));
    server.expose('getRoles', (request) => authenticator.getRoles(request));
    server.expose('getUser',  (request) => authenticator.getUser(request));

    // server.expose('checkPrivilegesWithRequest', (...args) => authenticator.checkPrivilegesWithRequest(...args));


    // const result = await authenticator._service.whoAMI(
    //     "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1NTE5NzU5NTE3NDUsImFjbCI6eyJjZHIiOlsiKiIsInJvIl0sImNkci9maWxlcyI6WyIqIiwicm8iXSwiY2RyL21lZGlhIjpbIioiXX19.Ubr-IBIi5fhHcCLw6CfzQ2abBdOfYsroucb86-7jgis",
    //     "33f6b8e9-961f-46f0-81db-6d8965f46884"
    // );
    // console.log(result);
    // console.log("----------------------------------------------");


}
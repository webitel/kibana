import User  from './user'

export default class AuthClient {

    _client = null;

    constructor(server) {
        this._client = server.plugins.webitel_main.webitelClient;
    }

    async getRoles (token, key) {
        return await this._client.api('GET', '/api/v2/acl/roles', null, {
            "x-access-token": token,
            "x-key": key,
            "content-type": 'application/json',
        });
    }

    async whoAMI (token, key) {
        const response = await this._client.api('GET', '/api/v2/whoami', null, {
            "x-access-token": token,
            "x-key": key,
            "content-type": 'application/json',
        });
        const params = {
            token,
            key,
            ...response
        };

        return new User(params)
    }

    async authenticate(request) {

    }

    async loginByCredentials(username, password) {
        const params = await this._client.api('POST', '/login', {username, password});

        return new User(params)
    }

    async logout(token, key) {
        return await this._client.api('POST', '/logout', null, {
            "x-access-token": token,
            "x-key": key,
            "content-type": 'application/json',
        });
    }
}
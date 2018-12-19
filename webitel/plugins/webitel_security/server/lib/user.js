
export default class User {
    _domain = null;
    _id = null;
    _expires = null;
    _token = null;
    _key = null;
    _acl = null;
    _role = null;

    constructor({domain, username, expires, token, key, acl, id, roleName}) {
        this._domain = domain || null;
        this._id = id || username;
        this._expires = expires;
        this._token = token;
        this._key = key;
        this._acl = acl;
        this._role = roleName;
    }

    getDomain() {
        return this._domain || null;
    }

    getRole() {
        return this._role
    }

    getId() {
        return this._id
    }

    getSession() {
        return {
            token: this._token,
            key: this._key,
        }
    }

    getAuthKey() {
        return this._key
    }

    getAuthToken() {
        return this._token
    }

    getCdrHost() {
        return 'http://pre.webitel.com/cdr'
    }

    whoAMI() {

        return {
            ...this.getSession(),
            username: this.getId(),
            domain: this.getDomain()
        }
    }

    checkPermission(resource = "", permission = "") {
        if (this._acl.hasOwnProperty(resource)) {
            return this._acl[resource].indexOf('*') !== -1 || this._acl[resource].indexOf(permission) !== -1
        }
        return false
    }
}
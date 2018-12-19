import { get, uniq } from 'lodash';

export class SecureSavedObjectsClientWrapper {
    constructor(options) {
        const {
            baseClient,
            request,
            spaces,
            errors,
            checkPrivilegesWithRequest
        } = options;
        this.errors = errors;

        this._baseClient = baseClient;
        this._request = request;
        this._spaces = spaces;
        this._checkPrivilegesWithRequest = checkPrivilegesWithRequest;
    }

    async create(type, attributes = {}, options = {}) {
        await this._ensureAuthorized(
            type,
            'c',
            { type, attributes, options },
        );

        return await this._baseClient.create(type, attributes, options);
    }

    async bulkCreate(objects, options = {}) {
        const types = uniq(objects.map(o => o.type));
        await this._ensureAuthorized(
            types,
            'c',
            { objects, options },
        );

        return await this._baseClient.bulkCreate(objects, options);
    }

    async delete(type, id, options) {
        await this._ensureAuthorized(
            type,
            'd',
            { type, id, options },
        );

        return await this._baseClient.delete(type, id, options);
    }

    async find(options = {}) {
        await this._ensureAuthorized(
            options.type,
            'r',
            { options }
        );

        return this._baseClient.find(options);
    }

    async bulkGet(objects = [], options = {}) {
        const types = uniq(objects.map(o => o.type));
        await this._ensureAuthorized(
            types,
            'r',
            { objects, options },
        );

        return await this._baseClient.bulkGet(objects, options);
    }

    async get(type, id, options = {}) {
        await this._ensureAuthorized(
            type,
            'r',
            { type, id, options },
        );

        return await this._baseClient.get(type, id, options);
    }

    async update(type, id, attributes, options = {}) {
        await this._ensureAuthorized(
            type,
            'u',
            { type, id, attributes, options },
        );

        return await this._baseClient.update(type, id, attributes, options);
    }

    async _ensureAuthorized(typeOrTypes, action) {
        const spaceId = this._spaces.getSpaceId(this._request);
        if (!spaceId || spaceId === 'default') { //TODO
            return;
        }
        const types = Array.isArray(typeOrTypes) ? typeOrTypes : [typeOrTypes];
        if (await this._checkPrivilegesWithRequest(this._request, spaceId, types, action)) {
            console.log('callow ', typeOrTypes, action)
            return;
        }

        const msg = `Unable to ${action} ${[...types].sort().join(',')}`;
        throw this.errors.decorateForbiddenError(new Error(msg));

        // console.log(types)
    }
}
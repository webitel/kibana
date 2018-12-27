import Boom from 'boom';
import { omit, get } from 'lodash';

export default class SpacesClient {
    constructor(options) {
        const {
            request,
            callWithRequestRepository,
            config,
            user
        } = options;
        this._request = request;
        this.config = config;
        this._user= user;
        this.callWithRequestSavedObjectRepository = callWithRequestRepository;
    }

    async canEnumerateSpaces() {
        return this._user && (this._user.checkPermission('kibana', 'u') ||
            this._user.checkPermission('kibana', 'd') ||
            this._user.checkPermission('kibana', 'c'))
    }

    async getAll() {
        const { saved_objects } = await this.callWithRequestSavedObjectRepository.find({
            type: 'space',
            page: 1,
            sortField: 'name.keyword',
        });

        const spaces = saved_objects.map(this.transformSavedObjectToSpace);

        if (!spaces.length) {
            const attributes = {
                name: "Default",
                description: "This is your default space!",
                color: "#00bfb3",
                _reserved: true,
                createdOn: Date.now(),
                modifyOn: Date.now(),
                createdBy: this._user.getId(),
                modifyBy: this._user.getId()
            };

            const id = "default";
            await this.callWithRequestSavedObjectRepository.create('space', attributes, { id });
            return [];
        }

        return spaces.filter((space) => {
            return space._reserved || ~get(space, 'acl.config.r', []).indexOf(this._user.getRole())
        });
    }

    //TODO
    async get(id) {
        const savedObject = await this.callWithRequestSavedObjectRepository.get('space', id);
        console.log('TODO SpacesClient');
        return this.transformSavedObjectToSpace(savedObject);
    }

    async create(space) {
        await this.ensureAuthorizedAtSpace('c', 'Unauthorized to create spaces');

        const { total } = await this.callWithRequestSavedObjectRepository.find({
            type: 'space',
            page: 1,
            perPage: 0,
        });
        if (total >= this.config.get('xpack.spaces.maxSpaces')) {
            throw Boom.badRequest(
                'Unable to create Space, this exceeds the maximum number of spaces set by the xpack.spaces.maxSpaces setting'
            );
        }
        space.createdOn =  space.modifyOn = Date.now();
        space.createdBy = space.modifyBy = this._user.getId();
        space.acl = defaultSpaceAcl(this._user.getRole());

        const attributes = omit(space, ['id', '_reserved']);
        const id = space.id;
        const createdSavedObject = await this.callWithRequestSavedObjectRepository.create('space', attributes, { id });
        return this.transformSavedObjectToSpace(createdSavedObject);
    }

    async update(id, space) {
        await this.ensureAuthorizedAtSpace('u', 'Unauthorized to update spaces');

        const attributes = omit(space, 'id', '_reserved');
        await this.callWithRequestSavedObjectRepository.update('space', id, attributes);
        const updatedSavedObject = await this.callWithRequestSavedObjectRepository.get('space', id);
        return this.transformSavedObjectToSpace(updatedSavedObject);
    }

    async delete(id) {
        await this.ensureAuthorizedAtSpace('d', 'Unauthorized to delete spaces');

        const existingSavedObject = await this.callWithRequestSavedObjectRepository.get('space', id);
        if (isReservedSpace(this.transformSavedObjectToSpace(existingSavedObject))) {
            throw Boom.badRequest('This Space cannot be deleted because it is reserved.');
        }

        await this.callWithRequestSavedObjectRepository.delete('space', id);

        await this.callWithRequestSavedObjectRepository.deleteByNamespace(id);
    }

    async ensureAuthorizedAtSpace(method, forbiddenMessage = "") {
        if (!this._user.checkPermission('kibana', method)) {
            throw Boom.forbidden(forbiddenMessage);
        }
    }

    transformSavedObjectToSpace (savedObject) {
        return {
            id: savedObject.id,
            ...savedObject.attributes,
        };
    }
}

function isReservedSpace(space) {
    return get(space, '_reserved', false);
}

function defaultSpaceAcl(currentGroup = "") {
    return {
        "config": {
            ...spaceDefaultPermission(currentGroup)
        },
        "index-pattern": {
            ...spaceDefaultPermission(currentGroup)
        },
        "search": {
            ...spaceDefaultPermission(currentGroup)
        },
        "dashboard": {
            ...spaceDefaultPermission(currentGroup)
        },
        "visualization": {
            ...spaceDefaultPermission(currentGroup)
        },
        "canvas-workpad": {
            ...spaceDefaultPermission(currentGroup)
        }
    }
}

function spaceDefaultPermission(currentGroup) {
    return {
        c: [currentGroup],
        r: [currentGroup],
        u: [currentGroup],
        d: [currentGroup]
    }
}
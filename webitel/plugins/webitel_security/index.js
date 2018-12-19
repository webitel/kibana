import {resolve} from 'path';
import initLoginView from './server/routes/views/login';
import initLogoutView from './server/routes/views/logout';
import initAuthenticateApi from './server/routes/api/v1/authenticate';
import initRolesApi from './server/routes/api/v1/roles';
import initSpacesApi from './server/routes/api/v1/spaces';
import {authenticateFactory} from './server/lib/auth_redirect';

import {initAuthenticator} from './server/lib/authenticator';
import {SecureSavedObjectsClientWrapper} from './server/lib/saved_objects_client'
import indexTemplate from './server/lib/setup_index_template';
import {createAuthorizationService} from './server/lib/authorization_service'

import SpacesClient from './server/lib/spaces/spaces_client'


export const webitel_security = (kibana) => new kibana.Plugin({
    require: ['webitel_main', 'kibana', 'elasticsearch', 'spaces'],
    id: 'webitel_security',
    name: 'webitel_security',
    publicDir: resolve(__dirname, 'public'),
    configPrefix: 'webitel.security',
    config(Joi) {
        return Joi.object({
            enabled: Joi.boolean().default(true),
            cookieName: Joi.string().default('sid'),
            encryptionKey: Joi.string().default('blablablablablablablablablablablablablablablablablablablablabla'),
            sessionTimeout: Joi.number().default(2147483647),
            secureCookies: Joi.boolean().default(false),
            userName: Joi.string(),
            password: Joi.string()
        }).default();
    },
    uiExports: {
        // hacks: ['plugins/webitel_security/chrome/readonly'],
        chromeNavControls: ['plugins/webitel_security/views/logout_button'],
        home: ['plugins/webitel_security/register_feature'],
        managementSections: ['plugins/webitel_security/views/management'],
        apps: [
            {
                id: 'login',
                title: 'Login',
                main: 'plugins/webitel_security/views/login',
                hidden: true
            },
            {
                id: 'logout',
                title: 'Logout',
                main: 'plugins/webitel_security/views/logout',
                hidden: true
            }
        ]
    },

    async init(server, options) {

        const {setupIndexTemplate, waitForElasticsearchGreen} = indexTemplate(this, server);

        waitForElasticsearchGreen().then(() => {
            setupIndexTemplate();

        });

        const cluster = server.plugins.elasticsearch.getCluster('admin');
        const baseCallWithRequest = cluster.callWithRequest;

        // server.ext({
        //     type: 'onRequest',
        //     method: function (request, h) {
        //         console.log('r', request.path);
        //         if (!request.path.startsWith("/elasticsearch") && !request.path.startsWith("/api") && !request.path.startsWith("/app")) {
        //             return h.continue();
        //         }
        //         const user = server.plugins.webitel_security.getUser(request);
        //         if (!user)
        //             throw `Loggin`;
        //
        //         return h.continue();
        //     }
        // });

        const callWithUser = (request, endpoint, clientParams = {}, options = {}) => {
            const user = server.plugins.webitel_security.getUser(request);
            if (!user)
                throw `Loggin`;

            if (clientParams.hasOwnProperty('index') && user.getDomain()) {
                clientParams.index += `-${user.getDomain()}`;
            } else {
                console.log("www")
            }
            return baseCallWithRequest(request, endpoint, clientParams, options);
        };

        server.plugins.spaces.spacesClient.getScopedClient = request => {
            // console.log("getScopedClient");
            const {savedObjects} = server;
            const callCluster = (endpoint, clientParams = {}, options = {}) => {
                return callWithUser(request, endpoint, clientParams, options);
            };
            const callWithRequestRepository = savedObjects.getSavedObjectsRepository(callCluster);

            return new SpacesClient({
                request,
                callWithRequestRepository,
                config: server.config(),
                user: server.plugins.webitel_security.getUser(request),
            });
        };

        const {savedObjects} = server;
        const authorization = createAuthorizationService(server, cluster, server.config().get('kibana.index'));

        savedObjects.addScopedSavedObjectsClientWrapperFactory(Number.MIN_VALUE, ({client, request}) => {
            const {spaces} = server.plugins;
            return new SecureSavedObjectsClientWrapper({
                baseClient: client,
                errors: savedObjects.SavedObjectsClient.errors,
                request,
                spaces,
                checkPrivilegesWithRequest: authorization.checkPrivilegesWithRequest
            });

        });

        savedObjects.setScopedSavedObjectsClientFactory(({
                                                             request,
                                                         }) => {

            const callCluster = (endpoint, clientParams = {}, options = {}) => {
                return callWithUser(request, endpoint, clientParams, options);
            };

            const callWithRequestRepository = savedObjects.getSavedObjectsRepository(callCluster);
            return new savedObjects.SavedObjectsClient(callWithRequestRepository);
        });


        server.auth.scheme('login', () => ({authenticate: authenticateFactory(server)}));
        server.auth.strategy('session', 'login', 'required');

        await initAuthenticator(server);

        initAuthenticateApi(server);
        initRolesApi(server);
        initSpacesApi(server);
        initLoginView(server, this);
        initLogoutView(server, this);
    }
});
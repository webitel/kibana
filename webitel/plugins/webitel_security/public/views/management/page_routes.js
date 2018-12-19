import 'ui/autoload/styles';
import routes from 'ui/routes';
import template from 'plugins/webitel_security/views/management/template.html';

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import { UserProfileProvider } from 'plugins/xpack_main/services/user_profile';
import { SpacesManager } from '../../lib/spaces_manager';
import { SpacesACLGridPage } from './acl_grid';
import { ManageSpacesACLPage } from './acl_edit';

import { RoleManager } from '../../lib/role_manager'

const reactRootNodeId = 'manageSpacesACLReactRoot';

routes.when('/management/security_spaces/list', {
    template,
    controller($scope, $http, chrome, Private, spaceSelectorURL) {
        const userProfile = Private(UserProfileProvider);

        $scope.$$postDigest(() => {
            const domNode = document.getElementById(reactRootNodeId);
            const spacesManager = new SpacesManager($http, chrome, spaceSelectorURL);

            render(
                <SpacesACLGridPage
                    spacesManager={spacesManager}
                    userProfile={userProfile}
                />,
                domNode
            );


            // unmount react on controller destroy
            $scope.$on('$destroy', () => {
                if (domNode) {
                    unmountComponentAtNode(domNode);
                }
            });
        });

    },
});

routes.when('/management/security_spaces/edit/:spaceId', {
    template,
    controller($scope, $http, chrome, Private, spaceSelectorURL, $route) {
        const userProfile = Private(UserProfileProvider);

        $scope.$$postDigest(() => {
            const domNode = document.getElementById(reactRootNodeId);
            const spacesManager = new SpacesManager($http, chrome, spaceSelectorURL);
            const roleManager = new RoleManager($http, chrome);

            const {spaceId} = $route.current.params;

            render(
                <ManageSpacesACLPage
                    spaceId={spaceId}
                    spacesManager={spacesManager}
                    roleManager={roleManager}
                    userProfile={userProfile}
                />,
                domNode
            );

            // unmount react on controller destroy
            $scope.$on('$destroy', () => {
                if (domNode) {
                    unmountComponentAtNode(domNode);
                }
            });
        });
    }
});
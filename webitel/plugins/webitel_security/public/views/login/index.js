import { parse } from 'url';
import { get } from 'lodash';
import 'ui/autoload/styles';
import 'plugins/webitel_security/views/login/login.less';
import template from 'plugins/webitel_security/views/login/login.html';
import chrome from 'ui/chrome';
import { parseNext } from 'plugins/webitel_security/lib/parse_next';

import React from 'react';
import { render } from 'react-dom';

import { LoginPage } from './components'

chrome
    .setVisible(false)
    .setRootTemplate(template)
    .setRootController('login', function ($scope, $http, $window) {
        const basePath = chrome.getBasePath();
        const next = parseNext($window.location.href, basePath);

        $scope.$$postDigest(() => {
            const domNode = document.getElementById('reactLoginRoot');

            render(
                <LoginPage
                    http={$http}
                    window={$window}
                    next={next}
                />,
                domNode
            );
        });
    });




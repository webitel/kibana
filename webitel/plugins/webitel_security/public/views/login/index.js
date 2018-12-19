import { parse } from 'url';
import { get } from 'lodash';
import 'ui/autoload/styles';
import 'plugins/webitel_security/views/login/login.less';
import template from 'plugins/webitel_security/views/login/login.html';
import chrome from 'ui/chrome';
import { parseNext } from 'plugins/webitel_security/lib/parse_next';

chrome
    .setVisible(false)
    .setRootTemplate(template)
    .setRootController('login', function ($scope, $http, $window) {
        const basePath = chrome.getBasePath();
        const next = parseNext($window.location.href, basePath);
        $scope.isLoading = false;
        $scope.submit = (username, password) => {
            $scope.isLoading = true;
            $scope.error = null;
            $http.post('./api/webitel/v1/login', {username, password}).then(
                (response) => {
                    $scope.isLoading = false;
                    window.location.href = next;
                },
                (result) => {
                    console.error(result);
                    $scope.error = `${result.statusText}: ${(result.data && result.data.message) || result.data}`;
                    $scope.isLoading = false;
                }
            );
        }
    });




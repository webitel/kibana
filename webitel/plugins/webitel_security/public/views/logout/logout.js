import chrome from 'ui/chrome';
import 'plugins/webitel_security/views/logout/logout.less'

chrome
    .setVisible(false)
    .setRootController('logout', ($http, $window) => {
        $http.post('./api/webitel/v1/logout', {}).then(
            () => {
                // Redirect user to the server logout endpoint to complete logout.
                $window.location.href = chrome.addBasePath(`/login`);
            },
            err => {
                //TODO
                console.error(err);
                $window.location.href = chrome.addBasePath(`/`);
            }
        );
    });

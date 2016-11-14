import chrome from 'ui/chrome';
import 'plugins/security/views/logout/logout.less';
chrome
    .setVisible(false)
    .setRootController('logout', ($http, $window) => {
      const url = `./login${$window.location.search}`;
      $http.post('./api/webitel/v1/logout', {}).then(
          () => $window.location.href = url
      );
    });

import { parse } from 'url';
import { get } from 'lodash';
import 'ui/autoload/styles';
import 'plugins/security/views/login/login.less';
import template from 'plugins/security/views/login/login.html';
import chrome from 'ui/chrome';
import parseNext from 'plugins/security/lib/parse_next';

chrome
    .setVisible(false)
    .setRootTemplate(template)
    .setRootController('login', function ($http, $window) {
      const next = parseNext($window.location);
      const self = this;

      self.submit = (username, password) => {
        self.isLoading = true;
        self.error = false;
        $http.post('./api/webitel/v1/login', {username, password}).then(
            (response) => window.location.href = `.${next}`,
            (error) => {
              self.error = true;
              self.isLoading = false;
            }
        );
      }
    });
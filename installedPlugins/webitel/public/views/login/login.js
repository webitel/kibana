require('plugins/webitel/views/login/login.less');
const parseNext = require('plugins/webitel/lib/parse_next');
const kibanaLogoUrl = require('plugins/webitel/images/kibana.svg');

require('ui/chrome')
.setVisible(false)
.setRootTemplate(require('plugins/webitel/views/login/login.html'))
.setRootController('login', ($http) => {
  const next = parseNext(window.location);

  return {
    kibanaLogoUrl,
    submit(username, password) {
      $http.post('./api/webitel/v1/login', {username, password}).then(
        (response) => window.location.href = `.${next}`,
        (error) => this.error = true
      );
    }
  };
});

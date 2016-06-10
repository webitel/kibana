require('ui/chrome')
.setVisible(false)
.setRootController('logout', ($http) => {
  $http.post('./api/webitel/v1/logout', {}).then(
    (response) => window.location.href = './login'
  );
});

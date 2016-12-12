/**
 * Created by igor on 12.12.16.
 */

"use strict";

import routes from 'ui/routes';
import template from 'plugins/reporting/views/management/emailPage.html';
require('plugins/reporting/services/emailService');



routes.when('/management/kibana/email', {
  template,
  controller($scope, $http, emailService) {
    $scope.field = {};
    emailService.get((err, res) => {
      if (err)
        return console.error(err);

      $scope.field = res;
    });
    $scope.submit = () => {

      emailService.post($scope.field, (err, res) => {
        if (err) {
          console.error(err);
        }
      })
    };
  }
});

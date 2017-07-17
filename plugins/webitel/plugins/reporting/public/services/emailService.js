/**
 * Created by igor on 12.12.16.
 */

"use strict";


import {uiModules} from 'ui/modules';

uiModules.get('webitel/reporting')
  .service('emailService', function ($http) {
    this.get = (cb) => {
      $http.get('../api/reporting/v1/email').then(
        (response) => {
          let data = (response.data && response.data._source) || {};
          cb(null, data)
        },
        (error) => {
          // TODO
          console.error(error);
          cb(error);
        }
      );
    };

    this.post = (field, cb) => {
      $http.post('../api/reporting/v1/email', field).then(
        (response) => {
          console.debug(response);
          return cb(null, response)
        },
        (error) => {
          // TODO
          console.error(error);
          return cb(error)
        }
      );
    }
  });

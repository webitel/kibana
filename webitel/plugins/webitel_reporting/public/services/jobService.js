/**
 * Created by igor on 09.12.16.
 */

"use strict";

import {uiModules} from 'ui/modules';

uiModules.get('webitel/reporting')
  .service('jobService', function ($http) {
    this.getAll = (cb) => {
      $http.get('../api/reporting/v1/jobs').then(
        (response) => {
          let data = [];
          response.data.hits.hits.forEach( e => data.push(e));
          cb(null, data)
        },
        (error) => {
          // TODO
          console.error(error);
          cb(error);
        }
      );
    };

    this.updateVis = (jobId, vis, cb) => {
      $http.put('../api/reporting/v1/jobs/' + jobId, {vis}).then(
        (response) => {
          let data = [];
          cb(null, response.data)
        },
        (error) => {
          // TODO
          console.error(error);
          cb(error);
        }
      );
    }

    this.get = (jobId, visId, cb) => {

    }
  });

/**
 * Created by igor on 14.11.16.
 */

"use strict";

import routes from 'ui/routes';
import template from 'plugins/reporting/views/management/reportingSection.html';


routes.when('/management/kibana/reporting', {
    template,
    controller($scope, $http) {
        $scope.jobs = [];

        function reloadData() {
            $http.get('../api/reporting/v1/jobs', {}).then(
                (response) => {
                    $scope.jobs = [];
                    response.data.hits.hits.forEach( i => {
                        var j = i._source;
                        j.name = i._id;
                        j.encodeName = encodeURIComponent(j.name);
                        $scope.jobs.push(j);
                    })
                },
                (error) => {
                    // TODO
                    console.error(error);
                }
            );
        }

        $scope.encodeName = name = encodeURIComponent(name);

        $scope.removeJob = function (name) {
            // TODO add notifycation;

            $http.delete('../api/reporting/v1/jobs/' + encodeURIComponent(name), {}).then(
                (response) => {
                    setTimeout(function () {
                        reloadData();
                    }, 1000)
                },
                (error) => {
                    // TODO
                    reloadData();
                    console.error(error);
                }
            );
        };

        reloadData();
    }
});

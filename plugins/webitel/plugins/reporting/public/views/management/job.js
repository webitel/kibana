/**
 * Created by igor on 06.12.16.
 */

"use strict";

import routes from 'ui/routes';
import template from 'plugins/reporting/views/management/jobPage.html';
import 'plugins/reporting/views/management/job.css';
import registry from 'plugins/kibana/management/saved_object_registry';

import VisProvider from 'ui/vis';




routes.when('/management/kibana/reporting/new', {
    template,
    controller
});

routes.when('/management/kibana/reporting/:id/edit', {
    template,
    controller
});

function controller($scope, $http, savedVisualizations, $timeout, $routeParams, $location, quickRanges, Private, config, indexPatterns) {

    $scope.field = {vis: []};
    $scope.intervalOptions = quickRanges;
    $scope.isNew = !$routeParams.id;


    $scope.submit = () => {
        $http.post('../api/reporting/v1/jobs', $scope.field).then(
            (response) => {
                console.debug(response);
                close();
            },
            (error) => {
                // TODO
                console.error(error);
            }
        );
    };

    $scope.removeVis = (item, event) => {
      event.preventDefault();
      let vis = $scope.field.vis;
      for (let i = 0; i < vis.length; i++) {
        if (vis[i].name === item.name) {
          $scope.field.vis.splice(i, 1);
          return;
        }
      }
    };

    if ($routeParams.id) {
        $http.get('../api/reporting/v1/jobs/' + $routeParams.id).then(
            (response) => {
                $scope.field = response.data._source;
                $scope.field.name = response.data._id;
            },
            (error) => {
                // TODO
                console.error(error);
            }
        );
    }

    $scope.getCheckedVis = item => {
        for (let vis of $scope.field.vis)
            if (vis.uuid === item.uuid)
                return true;

        return false;
    };

    $scope.serviceObj = [];
    $scope.close = close;

    $scope.openVis = vis => {
        savedVisualizations.open(vis)
    };

    $scope.editVis = vis => {
        savedVisualizations.edit({serviceName:"visualizations"}, {url: vis.url})
    };


    $scope.toggleItem = (item) => {
        const clone = angular.copy(item);
        const vis = $scope.field.vis;
        for (var i = 0; i < vis.length; i++) {
          if (vis[i].uuid === item.uuid) {
            vis.splice(i, 1);
            return;
          }
        }
        vis.push(clone);
    };

    function close() {
        // $timeout(function () {
          $location.path('/management/kibana/reporting')
        // }, 1000)

    }

    const visTypes = ["area", "table", "line", "metric", "histogram"];

}


const intervalOptions = [
    {
        id: "today",
        name: "Today"
    }
]

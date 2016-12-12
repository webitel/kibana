import _ from 'lodash';
import 'ui/agg_table';
import reportSpyModeTemplate from 'plugins/reporting/spy_report/spy_report.html';
import 'plugins/reporting/views/management/job.css';

require('plugins/reporting/services/jobService');

function VisSpyReportProvider(Notifier, $filter, $rootScope, config, Private, jobService) {


  return {
    name: 'reporting',
    display: 'Jobs',
    order: 10,
    template: reportSpyModeTemplate,
    link: function tableLinkFn($scope, $el) {
      $scope.$bind('req', 'searchSource.history[searchSource.history.length - 1]');
      $scope.jobs = [];
      $scope.selectedJobs = {};
      $scope.supportVis = false;
      let visId = '';
      $scope.$watch('vis.title', function (val) {
        visId = val;
        if (visId) {
          refreshJobsAll()
        }
      });
      $scope.$parent.$parent.$parent.$on('application.saved', e => {
        saveJobs();
      });

      $scope.$watchMulti([
        'req',
        'searchSource',
        'vis'
      ], function () {
        if (!$scope.searchSource || !$scope.req || !$scope.vis) return;
        const req = $scope.req;
        $scope.supportVis = $scope.vis.type.name === 'table';
        if (req.fetchParams) {
        }
      });


      var updatedJobs = [];
      $scope.changeSelectedJob = job => {
        if (!~updatedJobs.indexOf(job._id)) {
          updatedJobs.push(job._id)
        }
      };

      function saveJobs() {
        if (updatedJobs.length === 0)
          return;
        const req = $scope.req;
        let body = angular.copy(req.fetchParams.body);
        delete body.highlight;
        for (let i in body.query.bool.must) {
          if (body.query.bool.must[i].hasOwnProperty('range')) {
            body.query.bool.must.splice(i, 1);
            break;
          }
        };

        const visState = {
          name: $scope.vis.title,
          //TODO
          uuid: $scope.vis.title,
          indexPattern: $scope.vis.indexPattern.id,
          type: $scope.vis.type.name,
          state: $scope.vis.getState(),
          body: body
        };

        for (let job of $scope.jobs) {
          let vis = job._source.vis || [];
          let _vis = excludeVis(vis, $scope.vis.title);

          if (job._selected) {
            _vis.push(visState);
          }

          jobService.updateVis(job._id, _vis, (err, res) => {
            if (err)
              alert(err);

          })
        }
      }

      function excludeVis(vis, visName) {
        let res = [];
        for (let v of vis)
          if (v.name !== visName)
            res.push(v);
        return res;
      }

      function getJob (jobId) {
        for (let job of $scope.jobs)
          if (job._id === jobId)
             return job;
      }

      function refreshJobsAll() {
        jobService.getAll((err, res) => {
          if (err) {
            return console.error(err);
          }
          $scope.selectedJobs = {};
          updatedJobs.length = 0;
          for (let job of res) {
            for (let vis of job._source.vis) {
              if (vis.name === visId) {
                job._selected = true;
                // $scope.selectedJobs[job.name] = true;
                break;
              }
            }
          }


          $scope.jobs = res;
          console.log($scope.jobs)
        });
      }

      $scope.checked = item => {

      }


    }
  };
}

require('ui/registry/spy_modes').register(VisSpyReportProvider);

/**
 * Created by igor on 11.06.16.
 */

define(function (require) {
    // get the kibana/metric_vis module, and make sure that it requires the "kibana" module if it
    // didn't already
    var module = require('ui/modules').get('kibana/webitel/iframe_vis', ['kibana']);

    module.controller('KbnIFrameVisController', function ($scope, Private, $sce, $interval, $timeout) {
        var stopTime ;

        $scope.$watch('vis.params.iframe', function (val) {
            $scope.vis.params.iframesrc = $sce.trustAsResourceUrl(val);
        });

        $scope.$watch('vis.params.autoupdate', function (val) {
            cancelAutoRefreshFrame();
            if (val > 0) {
                $scope.setAutoRefresh(val);
            }
        });


        $scope.$on('$destroy', function () {
            cancelAutoRefreshFrame();
        });

        function cancelAutoRefreshFrame () {
            if (stopTime) {
                $interval.cancel(stopTime);
            };
        };

        function autoRefreshFrame () {
            $timeout(function() {
                var frameLink = $scope.vis.params.iframe;
                $scope.vis.params.iframe = '';
                $scope.$apply();
                $scope.vis.params.iframe = frameLink;
            });
        };

        $scope.setAutoRefresh = function (sec) {
            stopTime = $interval(autoRefreshFrame, sec * 1000);
        };
    })
        .directive("aIframe", function ($interval) {
            return {
                template: '<iframe ng-src={{vis.params.iframesrc}} style="display: block;border: none;height: 100%;width: 100%;"></iframe>',
                restrict: 'EA',
                //replace: true,

                link: function(scope, element, attrs) {
                    // TODO handle cross domain error.
                    //$(element).find("iframe").on("load", function (a, b, c) {

                    //});
                }
            };
        });
});
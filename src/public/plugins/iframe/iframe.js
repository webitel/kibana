/**
 * Created by i.navrotskyj on 06.10.2015.
 */

define('plugins/iframe/iframe_vis_controller',['require','modules'],function (require) {
    // get the kibana/metric_vis module, and make sure that it requires the "kibana" module if it
    // didn't already
    var module = require('modules').get('kibana/iframe_vis', ['kibana']);

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


define('plugins/iframe/iframe_vis',['require', 'text!plugins/iframe/iframe_vis.html', 'text!plugins/iframe/iframe_vis_params.html',
        'plugins/vis_types/template/template_vis_type', 'plugins/iframe/iframe_vis_controller'],
    function (require) {
        return function (Private) {
            var TemplateVisType = Private(require('plugins/vis_types/template/template_vis_type'));

            // return the visType object, which kibana will use to display and configure new
            // Vis object of this type.
            return new TemplateVisType({
                name: 'IFrame',
                title: 'Frame',
                icon: 'fa-external-link',
                description: 'An inline frame is used to embed another document within the current HTML document.',
                template: require('text!plugins/iframe/iframe_vis.html'),
                params: {
                    editor: require('text!plugins/iframe/iframe_vis_params.html')
                },
                requiresSearch: false
            });
        };
    });

// Init
define('plugins/iframe/index',['require','registry/vis_types', 'plugins/iframe/iframe_vis'],function (require) {
    require('registry/vis_types').register(function (Private) {
    	return Private(require('plugins/iframe/iframe_vis'));
    });
});
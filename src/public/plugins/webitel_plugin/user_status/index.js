
define('plugins/webitel_plugin/user_status/config', ['require'], function(require) {
    return {
        name: 'User list',
        subType: "table",
        handleName: 'userList',
        columns: [
            { title: 'Id', field: 'id', visible: true, filter: '' },
            { title: 'Name', field: 'name', visible: true, filter: '' },
            { title: 'Domain', field: 'domain', visible: true },
            { title: 'Online', field: 'online', visible: true, cellTemplate: "<span style='text-align: center;' class='fa fa-circle' ng-class='{\"w-online\" : item[column.field] == true, \"w-offline\" : item[column.field] != true}'></span>" },
            { title: 'Role', field: 'role', visible: true },
            { title: 'Agent', field: 'agent', visible: true },
        //    { title: 'Scheme', field: 'scheme', visible: true },
            //{ title: 'timer', field: 'timer', visible: true, cellTemplate: "<timer>{{timer}}</timer>" },
            { title: 'State', field: 'state', visible: true, ngClass: '{"w-account-onhook" : item[column.field] == "ONHOOK" || item[column.field] == "Waiting", "w-account-nonreg": item[column.field] == "NONREG", "w-account-isbusy": item[column.field] == "ISBUSY" || item[column.field] == "In a queue call", "w-account-receiving": item[column.field] == "Receiving"}' },
            { title: 'Status', field: 'status', visible: true },
            { title: 'Description', field: 'description', visible: true },
        ]
    }
});

define('plugins/webitel_plugin/user_status/webitel_plugin_vis_controller',['require', 'ng-table', 'modules', 'plugins/webitel_plugin/user_status/config', 'plugins/webitel_plugin/webitel'],function (require) {
    require('ng-table');
    var typeData = require('plugins/webitel_plugin/user_status/config');

    var module = require('modules').get('kibana/webitel_plugin_vis/user_status', ['kibana']);

    module
        .controller('KbnWebitelPluginVisController', function ($scope, $filter, NgTableParams, webitel) {
            webitel.then(function (webitel) {
                
                if (Object.keys($scope.vis.params).length == 0)
                    $scope.vis.params = {fake: true};

                $scope.domainSession = webitel.domainSession;

                if ($scope.domainSession) {
                    $scope.vis.params.domain = $scope.domainSession;
                };

                $scope.$watch('vis.params.domain', function (val) {
                    $scope.vis.params.domain = val;
                    $scope.tableParams.reload()
                });

                $scope.$watch('vis.params.columns', function (val) {
                    $scope.filtersObj = {};
                    angular.forEach(val, function (item, key) {
                        if (item['filter'] && item['filter'] != '')
                            $scope.filtersObj[key] = item['filter'];
                    });
                    if (val)
                        $scope.tableParams.reload();
                });

                // TODO

                $scope.$on('$destroy', function () {
                    webitelEventDataChange();
                });

                var webitelEventDataChange = $scope.$on('webitel:changeHashListUsers', function (e, data) {
                    $scope.tableParams && $scope.tableParams.reload()
                });

                $scope.$watch('vis.params.top', function (val) {
                    val = val || 10;
                    if (val > 0) {
                        $scope.tableParams.count(val)
                    };
                    $scope.vis.params.top = val;
                });
                //todo
                if (Object.keys($scope.vis.params).length == 0)
                    $scope.vis.params = {fake: true};

                $scope.hasSomeRows = true;
                $scope.tableParams = new NgTableParams({

                    },
                    {
                        counts: [],
                        getData: function($defer, params) {
                            webitel.getData(typeData.handleName, {domain: $scope.vis.params.domain, scope: $scope}, function (res) {
                                var data = res || [];
                                var sorting = params.sorting(),
                                    orderedData;

                                //$scope.vis.params.defSort = sorting;

                                orderedData = sorting ?
                                    $filter('orderBy')(data, params.orderBy()) :
                                    data;

                                orderedData = $scope.filtersObj ?
                                    $filter('filter')(orderedData, $scope.filtersObj) :
                                    orderedData;

                                $scope.hasSomeRows = data.length > 0;

                                params.total(orderedData.length );
                                //if ($scope.vis.params.top > 0) {
                                //	params.count($scope.vis.params.top);
                                //} else {
                                //	params.count(data.length + 1);
                                //};

                                $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                            });
                        }
                    })
            })
        })
        .controller('KbnWebitelPluginTypeController', function ($scope, webitel, $q) {
            webitel.then(function (api) {
                $scope.showDomains = !api.domainSession;
                if (!$scope.showDomains) return;

                api.getDomains(function (res) {
                    $scope.domains = res;
                })
            });
            $scope.showDomains = false;
            $scope.columns = typeData.columns;

            $scope.getDomains = function () {

            };
        })
    ;
});

define('plugins/webitel_plugin/user_status/webitel_plugin_vis',['require', 'css!plugins/webitel_plugin/user_status/webitel_plugin.css','plugins/webitel_plugin/user_status/webitel_plugin_vis_controller','plugins/vis_types/template/template_vis_type','text!plugins/webitel_plugin/user_status/webitel_plugin_vis.html','text!plugins/webitel_plugin/user_status/webitel_plugin_vis_params.html'],
    function (require) {

        // we need to load the css ourselves
        require('css!plugins/webitel_plugin/user_status/webitel_plugin.css');

        // we also need to load the controller and used by the template
        require('plugins/webitel_plugin/user_status/webitel_plugin_vis_controller');


        return function (Private) {
            var TemplateVisType = Private(require('plugins/vis_types/template/template_vis_type'));

            // return the visType object, which kibana will use to display and configure new
            // Vis object of this type.
            return new TemplateVisType({
                name: 'WebitelUserStatus',
                title: "Users monitor",
                icon: 'fa-users',
                description: 'Gives you access to the real-time users information such as status, state or endpoint registrations.',
                template: require('text!plugins/webitel_plugin/user_status/webitel_plugin_vis.html'),
                params: {
                    editor: require('text!plugins/webitel_plugin/user_status/webitel_plugin_vis_params.html')
                },
                requiresSearch: false
            });
        };
    });

// Init
define('plugins/webitel_plugin/user_status/index',['require', 'plugins/webitel_plugin/webitel', 'registry/vis_types','plugins/webitel_plugin/user_status/webitel_plugin_vis'],function (require) {

    require('registry/vis_types').register(function (Private) {
        return Private(require('plugins/webitel_plugin/user_status/webitel_plugin_vis'));
    });
});

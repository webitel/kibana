/**
 * Created by igor on 11.06.16.
 */

define(function (require) {
    var typeData = require('plugins/webitel/accounts/config');

    var module = require('ui/modules').get('kibana/webitel/accounts', ['kibana']);

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
});
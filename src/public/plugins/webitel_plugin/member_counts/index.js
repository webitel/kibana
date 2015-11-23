/**
 * Created by i.navrotskyj on 11.11.2015.
 */


define('plugins/webitel_plugin/member_counts/webitel_plugin_vis_controller', [], function () {
    var module = require('modules').get('kibana/webitel_plugin_vis', ['kibana']);
    
    module
        .controller('KbnWebitelPluginMemberCountsVisController', function ($scope, webitel) {

            $scope.domainSession = webitel.domainSession;
            $scope.users = {};
            $scope.countAgents = 0;
            $scope.members = {};
            $scope.available = {count: 0};
            $scope.busy = {count: 0};
            $scope.onbreak = {count: 0};
            $scope.offline = {count: 0};

            if ($scope.domainSession) {
                $scope.vis.params.domain = $scope.domainSession;
            };

            $scope.$on('$destroy', function () {
                webitel.unServerEvent('CC::MEMBERS-COUNT', {all: true}, onChange);
                webitel.unServerEvent('CC::AGENT-STATE-CHANGE', {all: true}, onAgentStateChange);
                webitel.unServerEvent('CC::AGENT-STATUS-CHANGE', {all: true}, onAgentStatusChange);
            });

            var onAgentStateChange = function (e) {
                var _user = $scope.users[e['CC-Agent']];
                if (_user) {
                    _user['state'] = e['CC-Agent-State'];
                    _user['line_status'] = getLineStatusFS(_user['state'], _user['status']);
                }
            };

            var onAgentStatusChange = function (e) {
                var _user = $scope.users[e['CC-Agent']];
                if (_user) {
                    _user['status'] = e['CC-Agent-Status'];
                    _user['line_status'] = getLineStatusFS(_user['state'], _user['status']);
                }
            };
            webitel.onServerEvent("CC::AGENT-STATE-CHANGE", onAgentStateChange,  {all: true});
            webitel.onServerEvent("CC::AGENT-STATUS-CHANGE", onAgentStatusChange,  {all: true});

            function getLineStatusFS (state, status) {
                if (status == 'Logged Out') {
                    return 'offline'
                } else if ( (status == 'Available' || status == 'Available (On Demand)') && state == 'Waiting') {
                    return 'available'
                } else if (status == 'On Break') {
                    return 'onbreak';
                } else {
                    return 'busy'
                }
            };


            function onChange (e) {
                var queue = e['CC-Queue'];
                if (queueName == queue)
                    $scope.members = e['CC-Count'];
            };

            webitel.onServerEvent("CC::MEMBERS-COUNT", onChange,  {all: true});

            $scope.$watch('vis.params.domain', function (val) {
                $scope.vis.params.domain = val;
            });

            var queueName = '';

            $scope.parseName = function (name) {
                return name.substring(0 ,name.indexOf('@'));
            };

            $scope.$watch('vis.params.count', function (val) {
                $scope.vis.params.count = val;
            });


            $scope.$watch('users', function (value) {
                var _status = {
                    available: 0,
                    busy: 0,
                    onbreak: 0,
                    offline: 0
                };
                var all = 0;
                angular.forEach(value, function (item) {
                    all++;
                    _status[item['line_status']]++;
                });

                $scope.countAgents = all;
                $scope.available.count = _status.available;
                $scope.busy.count = _status.busy;
                $scope.onbreak.count = _status.onbreak;
                $scope.offline.count = _status.offline;

            }, true);

            $scope.$watch('available.count', function (val) {
                $scope.available.style = {
                    "width": (Math.ceil((val * 100) / $scope.countAgents) || 0 ) + '%'  //"30%"
                };
            });
            $scope.$watch('busy.count', function (val) {
                $scope.busy.style = {
                    "width": (Math.ceil((val * 100) / $scope.countAgents) || 0 ) + '%'  //"30%"
                };
            });
            $scope.$watch('onbreak.count', function (val) {
                $scope.onbreak.style = {
                    "width": (Math.ceil((val * 100) / $scope.countAgents) || 0 ) + '%'  //"30%"
                };
            });
            $scope.$watch('offline.count', function (val) {
                $scope.offline.style = {
                    "width": (Math.ceil((val * 100) / $scope.countAgents) || 0 ) + '%'  //"30%"
                };
            });

            $scope.$watch('vis.params.queue', function (val) {
                $scope.vis.params.queue = val;
                queueName = val.name + '@' + val.domain;
                // /api/v2/callcenter/queues/:queue/members/count
                webitel.httpApi('/api/v2/callcenter/queues/' + val.name + '/members/count?domain=' + val.domain, function (err, res) {
                    if (err)
                        console.error(err);

                    $scope.members = ('' + (res && res.info)).trim()
                });

                $scope.users = {};

                webitel.httpApi('/api/v2/callcenter/queues/' + val.name + '/tiers?domain=' + val.domain, function (err, res) {
                    if (err) {
                        console.error(err);
                        return;
                    };

                    webitel.getData('userList', {domain: val.domain}, function (result) {
                        var _tmpNames = {};
                        angular.forEach(result, function (agent) {
                            _tmpNames[agent['id'] + '@' + agent['domain']] = agent['name'];
                        });

                        var agents = res && res.info;
                        angular.forEach(agents, function (item) {
                            $scope.countAgents++;
                            item['webitel_name'] = _tmpNames[item['name']];
                            item['line_status'] = getLineStatusFS(item.state, item.status);
                            $scope.users[item.name] = item;
                        });

                    });
                });
            });
        })
        .controller('KbnWebitelPluginMemberCountsParamController', function ($scope, webitel) {

            $scope.showDomains = !webitel.domainSession;
            $scope.getDomains = function () {
                //if (!$scope.showDomains) return;
                webitel.getDomains(function (res) {
                    $scope.domains = res;
                })
            };
            $scope.getQueue = function (domain) {
                webitel.getQueue( $scope.vis.params.domain || webitel.domainSession || domain, function (res) {
                    $scope.queueData = res;
                });
            };

            $scope.$watch('vis.params.domain', function (val) {
                $scope.queueData = {};
                webitel.getQueue( $scope.vis.params.domain || webitel.domainSession, function (res) {
                    $scope.queueData = res;
                });
            });
        })
    ;
});

define('plugins/webitel_plugin/member_counts/webitel_plugin_vis',['require', 'services/webitelSocket', 'css!plugins/webitel_plugin/member_counts/plugin.css', 'plugins/webitel_plugin/member_counts/webitel_plugin_vis_controller','plugins/vis_types/template/template_vis_type','text!plugins/webitel_plugin/member_counts/webitel_plugin_vis.html','text!plugins/webitel_plugin/member_counts/webitel_plugin_vis_params.html'],
    function (require) {

        // we need to load the css ourselves
        require('css!plugins/webitel_plugin/member_counts/plugin.css');

        // we also need to load the controller and used by the template
        require('plugins/webitel_plugin/member_counts/webitel_plugin_vis_controller');


        return function (Private) {
            var TemplateVisType = Private(require('plugins/vis_types/template/template_vis_type'));

            // return the visType object, which kibana will use to display and configure new
            // Vis object of this type.
            return new TemplateVisType({
                name: 'WebitelMembersCounts',
                title: "Member counts",
                icon: 'fa-crosshairs',
                description: 'Member count in the queue.',
                template: require('text!plugins/webitel_plugin/member_counts/webitel_plugin_vis.html'),
                params: {
                    editor: require('text!plugins/webitel_plugin/member_counts/webitel_plugin_vis_params.html')
                },
                requiresSearch: false
            });
        };
    });

// Init
define('plugins/webitel_plugin/member_counts/index',['require', 'plugins/webitel_plugin/webitel', 'registry/vis_types','plugins/webitel_plugin/member_counts/webitel_plugin_vis'],function (require) {

    require('registry/vis_types').register(function (Private) {
        return Private(require('plugins/webitel_plugin/member_counts/webitel_plugin_vis'));
    });
});

/**
 * Created by i.navrotskyj on 11.11.2015.
 */


define(function (require) {
    require('plugins/webitel_main/lib/webitel');

    var module = require('ui/modules').get('kibana/webitel/agents_monitor', ['kibana']);

    module
        .controller('KbnWebitelPluginAgentsMonitorVisController', function ($scope, webitel, $timeout) {
            webitel.then(function (webitel) {
                $scope.domainSession = webitel.domaginSession;
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
                    webitel.unServerEvent('CC::AGENT-STATE-CHANGE', {all: true}, onAgentStateChange);
                    webitel.unServerEvent('CC::AGENT-STATUS-CHANGE', {all: true}, onAgentStatusChange);
                });

                var onAgentStateChange = function (e) {
                    var _user = $scope.users[e['CC-Agent']];
                    if (_user) {
                        _user['state'] = e['CC-Agent-State'];
                        _user['line_status'] = getLineStatusFS(_user['state'], _user['status']);
                        // $scope.$apply();
                    }
                };

                var onAgentStatusChange = function (e) {
                    var _user = $scope.users[e['CC-Agent']];
                    if (_user) {
                        _user['status'] = e['CC-Agent-Status'];
                        _user['line_status'] = getLineStatusFS(_user['state'], _user['status']);
                        // $scope.$apply();
                    }
                };
                webitel.onServerEvent("CC::AGENT-STATE-CHANGE", onAgentStateChange,  {all: true});
                webitel.onServerEvent("CC::AGENT-STATUS-CHANGE", onAgentStatusChange,  {all: true});

                function getLineStatusFS (state, status) {
                    if (status === 'Logged Out') {
                        return 'offline'
                    } else if ( (status === 'Available' || status === 'Available (On Demand)') && state === 'Waiting') {
                        return 'available'
                    } else if (status === 'On Break') {
                        return 'onbreak';
                    } else {
                        return 'busy'
                    }
                }

                function setAgentFsState(agent) {
                  if (!agent['agent.status'] || agent['agent.status'] === 'Logged Out') {
                    agent.status = 'Logged Out';
                    agent.state = 'Waiting';
                    return;
                  }

                  if (agent.status === 'AGENT') {
                    agent.status = agent['agent.status'];
                    agent.state = agent.description;
                    return;
                  }

                  agent.status = agent['agent.status'];
                  if (agent.state === 'ISBUSY') {
                    agent.state = 'Idle';
                  } else {
                    agent.state = 'Waiting';
                  }

                }


                $scope.$watch('vis.params.domain', function (val) {
                    $scope.vis.params.domain = webitel.domainSession || val;
                    if (!$scope.vis.params.domain)
                      return;

                    webitel.getData('userList', {domain: $scope.vis.params.domain}, function (result) {
                      $scope.users = {};
                      var users = {};
                      angular.forEach(result, function (a) {
                        var agent = angular.copy(a);
                        if (agent.agent === 'true') {
                          $scope.countAgents++;
                          setAgentFsState(agent);
                          agent['line_status'] = getLineStatusFS(agent.state, agent.status);
                          users[agent['id'] + '@' + agent['domain']] = agent;
                        }
                      });
                      $scope.users = users;
                      $timeout(function () {
                          $scope.$apply()
                      }, 100)
                      // $scope.$apply()
                    });
                });

                $scope.parseName = function (name) {
                    return name.substring(0 ,name.indexOf('@'));
                };


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

            });
        })
        .filter('OrderByLine', function () {
            return function(items, field, reverse) {
                var filtered = [];

                var _sort = {
                    'available': 1,
                    'busy': 2,
                    'onbreak': 3,
                    'offline': 4
                };
                angular.forEach(items, function(item) {
                    filtered.push(item);
                });
                filtered.sort(function (a, b) {
                    return (_sort[a[field]] > _sort[b[field]] ? 1 : -1);
                });
                if(reverse) filtered.reverse();
                return filtered;

            }
        })
        .controller('KbnWebitelPluginAgentsMonitorParamController', function ($scope, webitel) {

            webitel.then(function (webitel) {
                $scope.showDomains = !webitel.domainSession;
                if ($scope.showDomains) {
                    webitel.getDomains(function (res) {
                        $scope.domains = res;
                        //$scope.$apply();
                    })
                }
                //
                // $scope.$watch('vis.params.domain', function (val) {
                //     $scope.queueData = {};
                //     webitel.getQueue( $scope.vis.params.domain || webitel.domainSession, function (res) {
                //         $scope.queueData = res;
                //     });
                // });
            });

        })
    ;
});

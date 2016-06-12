/**
 * Created by i.navrotskyj on 11.11.2015.
 */


define(function (require) {

    require('plugins/webitel/bower_components/angular-timer/dist/angular-timer.min');
    require('plugins/webitel/bower_components/ng-table/ng-table.less');
    require('plugins/webitel/bower_components/ng-table/ng-table.min');

    var module = require('ui/modules').get('kibana/webitel/members', ['kibana', 'ngTable', 'timer']);
    var config = require('plugins/webitel/members/config');
    
    var HashCollection = require('plugins/webitel/lib/hashCollection');


    module
        .controller('KbnWebitelPluginMemberListVisController', function ($scope, webitel, $filter, NgTableParams, $interval) {
            webitel.then(function (webitel) {
                if (Object.keys($scope.vis.params).length == 0)
                    $scope.vis.params = {fake: true};

                if (webitel.domainSession)
                    $scope.vis.params.domain = webitel.domainSession;

                $scope.hasSomeRows = true;

                $scope.$on('$destroy', function () {
                    webitel.unServerEvent('CC::MEMBER-QUEUE-START', {all: true}, onCreateMembers);
                    webitel.unServerEvent('CC::MEMBER-QUEUE-RESUME', {all: true}, onCreateMembers);
                    webitel.unServerEvent("CC::MEMBER-QUEUE-END", {all: true}, onMemberQueueEnd);

                    webitel.unServerEvent('CC::BRIDGE-AGENT-START', {all: true}, onBridgeAgentStart);
                    webitel.unServerEvent('CC::BRIDGE-AGENT-END', {all: true}, onBridgeAgentEnd);
                    webitel.unServerEvent('CC::AGENT-OFFERING', {all: true}, onAgentOffering);
                    webitel.unServerEvent('CC::BRIDGE-AGENT-FAIL', {all: true}, onAgentFail);
                });

                var hashListQueue = new HashCollection('id');

                var hashListsCallInQueue = new HashCollection('id');

                hashListQueue.onAdded.subscribe(function (item) {
                    var _q = item['CC-Queue'];
                    var queue = hashListsCallInQueue.get(_q);
                    if (queue) {
                        queue.push(item['id'])
                    } else {
                        hashListsCallInQueue.add(_q, [item['id']])
                    }
                    updateGroup(_q);
                });

                hashListQueue.onRemoved.subscribe(function (item) {
                    var _q = item['CC-Queue'];
                    var queue = hashListsCallInQueue.get(_q);
                    if (queue)
                        queue.splice(queue.indexOf(item['id']), 1);
                });

                function getJoinPosition (rec) {
                    var queueName = rec['CC-Queue'];

                    var data = getGroupQueue(queueName);
                    data.push(rec);
                    return getCurrentPosition(rec['id'], data);
                };

                function getCurrentPosition (id, queueData, item) {
                    var _s = $filter('orderBy')(queueData, "-score"),
                        pos = 1;

                    for (var i = 0, len = _s.length; i < len; i++) {
                        if (_s[i]['id'] == id) {
                            if (item)
                                item['cc_current_position'] = pos;
                            return pos;
                        }
                        pos++;
                    };
                    if (item)
                        item['cc_current_position'] = pos;
                    return pos;
                };

                function getGroupQueue (queueName) {
                    var callInQueue = hashListsCallInQueue.get(queueName) || [];
                    var data = [],
                        _item;

                    angular.forEach(callInQueue, function (id) {
                        _item = hashListQueue.get(id);
                        if (_item)
                            data.push(_item);
                    });

                    return data
                };

                function updateGroup (groupName) {
                    var data = $filter('orderBy')(getGroupQueue(groupName), "-score");
                    var iterator = 0;
                    for (var i = 0, len = data.length; i < len; i++) {
                        try {
                            if (data[i]['score'] != -1)
                                data[i]['cc_current_position'] = ++iterator;
                        } catch (e) {
                            debugger
                        }
                    }
                };

                function updateHashListQueue () {
                    var data = hashListQueue.collection;
                    angular.forEach(data, function (item) {
                        item['duration']++;
                        if (item['score'] != -1)
                            item['score']++;
                    });
                    updateData();
                };

                $interval(updateHashListQueue, 1000);

                function eventInDomain(queue) {
                    return queue.substr(queue.indexOf('@') + 1) == $scope.vis.params.domain;
                };

                var onCreateMembers = function (e) {
                    if (!eventInDomain(e['CC-Queue'])) return;
                    var _ct = Date.now();
                    var rec = {
                        "id": e["CC-Member-UUID"],
                        "session_uuid": e["variable_call_uuid"],
                        "Time": new Date().toLocaleTimeString(),
                        "createdOn": _ct,
                        'CC-Agent': [],
                        "CC-Member-CID-Name": e["CC-Member-CID-Name"],
                        "CC-Member-CID-Number": e["CC-Member-CID-Number"],
                        "CC-Queue": e["CC-Queue"],
                        // TODO resume member score ?? add join position in fs
                        "score": +e["variable_cc_base_score"] || 0,
                        "status": "In queue",
                        "duration": 0
                    };

                    rec['cc_start_position'] = rec['cc_current_position'] = getJoinPosition(rec);

                    hashListQueue.add(e["CC-Member-UUID"], rec);

                };

                var onMemberQueueEnd = function (e) {
                    if (!eventInDomain(e['CC-Queue'])) return;

                    var id = e['CC-Member-UUID'];
                    hashListQueue.remove(id);
                    updateGroup(e["CC-Queue"]);
                };

                var onAgentOffering = function (e) {
                    if (!eventInDomain(e['CC-Queue'])) return;

                    var id = e['CC-Member-UUID'];
                    var rec = hashListQueue.get(id);
                    if (rec) {
                        rec['CC-Agent'].push(e['CC-Agent']);
                        rec['status'] = 'Receiving';
                    };
                };

                var onBridgeAgentStart = function (e) {
                    if (!eventInDomain(e['CC-Queue'])) return;

                    var id = e['CC-Member-UUID'];
                    var rec = hashListQueue.get(id);
                    if (rec) {
                        //rec['CC-Agent'].push(e['CC-Agent']);
                        rec['status'] = 'In queue Call';
                        rec['score'] = -1;
                        rec['cc_current_position'] = 0;
                        rec['answeredOn'] = Date.now();
                    };
                    updateGroup(e["CC-Queue"]);
                };

                var onBridgeAgentEnd = function (e) {
                    if (!eventInDomain(e['CC-Queue'])) return;

                    var id = e['CC-Member-UUID'];
                    var rec = hashListQueue.get(id);
                    if (rec) {
                        var agentId = rec['CC-Agent'].indexOf(e['CC-Agent']);
                        if (agentId != -1)
                            rec['CC-Agent'].splice(agentId, 1);
                        //rec['CC-Agent'] = '';
                        rec['status'] = 'In queue';
                    };
                };

                var onAgentFail = function (e) {
                    if (!eventInDomain(e['CC-Queue'])) return;

                    var id = e['CC-Member-UUID'];
                    var rec = hashListQueue.get(id);
                    if (rec) {
                        var agentId = rec['CC-Agent'].indexOf(e['CC-Agent']);
                        if (agentId != -1)
                            rec['CC-Agent'].splice(agentId, 1);

                        if (rec['CC-Agent'].length == 0)
                            rec['status'] = 'In queue';
                    };
                };

                webitel.onServerEvent("CC::MEMBER-QUEUE-START", onCreateMembers,  {all: true});
                webitel.onServerEvent("CC::MEMBER-QUEUE-RESUME", onCreateMembers,  {all: true});
                webitel.onServerEvent("CC::MEMBER-QUEUE-END", onMemberQueueEnd,  {all: true});

                webitel.onServerEvent("CC::AGENT-OFFERING", onAgentOffering,  {all: true});
                webitel.onServerEvent("CC::BRIDGE-AGENT-START", onBridgeAgentStart,  {all: true});
                webitel.onServerEvent("CC::BRIDGE-AGENT-END", onBridgeAgentEnd,  {all: true});
                webitel.onServerEvent("CC::BRIDGE-AGENT-FAIL", onAgentFail,  {all: true});

                $scope.eavesdrop = function (uuid, side, display) {
                    webitel._instance.eavesdrop(null, uuid, {
                        "side": null,
                        "display": display
                    })
                };

                $scope.useWebPhone = function () {
                    return !!webitel.domainSession
                };

                $scope.parseAgents = function (agents) {
                    if (angular.isArray(agents)) {
                        return agents.map(function (item) {
                            return item.substring(0 ,item.indexOf('@'));
                        }).join(',');
                    }
                };

                $scope.getTime = function (currentDate, createdOn) {
                    if (!createdOn) return '00:00:00';
                    return (Math.ceil((currentDate - createdOn) / 1000) + '').toHHMMSS();
                };

                String.prototype.toHHMMSS = function () {
                    var sec_num = parseInt(this, 10);
                    var hours   = Math.floor(sec_num / 3600);
                    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
                    var seconds = sec_num - (hours * 3600) - (minutes * 60);

                    if (hours   < 10) {hours   = "0"+hours;}
                    if (minutes < 10) {minutes = "0"+minutes;}
                    if (seconds < 10) {seconds = "0"+seconds;}
                    var time    = hours+':'+minutes+':'+seconds;
                    return time;
                };

                var data = [];
                function updateData () {
                    data.length = 0;
                    angular.forEach(hashListQueue.collection, function (item) {
                        var _t = {};
                        for (var key in item) {
                            _t[key.replace(/-/g, '_')] = item[key]
                        };
                        data.push(_t);
                    });
                    $scope.totalCalls = data.length;
                    $scope.currentDate = Date.now();
                    $scope.tableParams && $scope.tableParams.reload()

                };

                $scope.tData = data;

                if ($scope.vis && $scope.vis.params && $scope.vis.params.domain)
                    updateData();


                var self = $scope;
                self.cols = config.columns;

                self.getCurrentPosition = webitel.getCurrentPosition;

                $scope.$watch('vis.params.columns', function (val) {
                    if (val) {
                        self.cols.length = 0;
                        angular.forEach(val, function (item) {
                            self.cols.push(item);
                        });
                    };
                });

                $scope.$watch('vis.params.domain', function (val) {
                    $scope.vis.params.domain = webitel.domainSession || val;

                    if ($scope.vis.params.domain) {
                        hashListQueue.removeAll();
                        initMembersByDomain($scope.vis.params.domain);
                    }
                });

                function initMembersByDomain (domainName) {
                    webitel.getQueueByDomain(domainName, function (items) {
                        var countRefresh = items.length,
                            pos = 0,
                            currentQueue = 0;

                        angular.forEach(items, function (item) {
                            webitel.httpApi('/api/v2/callcenter/queues/' + item['name'] + '/members?domain=' + domainName,
                                function (err, res) {
                                    if (err) {
                                        console.error(err);
                                    } else {
                                        angular.forEach(res.info, function (member) {
                                            if (member['state'] == "Abandoned" ) return;
                                            var _joinTime = +member['joined_epoch'] * 1000;
                                            var rec = {
                                                "id": member['uuid'],
                                                "session_uuid": member['session_uuid'],
                                                "Time": new Date(_joinTime).toLocaleTimeString(),
                                                "createdOn": _joinTime,
                                                'CC-Agent': [],
                                                "CC-Member-CID-Name": member["cid_name"],
                                                "CC-Member-CID-Number": member["cid_number"],
                                                "CC-Queue": member["queue"],
                                                "score": +member["score"],
                                                "status": "In queue",
                                                "duration": 0
                                            };
                                            rec['cc_start_position'] = rec['cc_current_position'] = 0; //getJoinPosition(rec);

                                            if (member['state'] == "Answered") {
                                                rec['status'] = 'In queue Call';
                                                rec['score'] = -1;
                                                rec['cc_current_position'] = 0;
                                                rec['answeredOn'] = +member['bridge_epoch'] * 1000;
                                                rec['CC-Agent'].push(member['serving_agent'])
                                            };

                                            hashListQueue.add(rec['id'], rec);
                                        });
                                    };
                                    if (currentQueue++ == (countRefresh - 1)) {

                                    };
                                });
                        });
                    });
                };

                self.isGroupHeaderRowVisible = false;



                self.tableParams = new NgTableParams({
                    // initial grouping
                    group: {
                        'CC_Queue': "desc"
                    }
                }, {
                    counts: [],
                    dataset: data,
                    groupOptions: {
                        isExpanded: true
                    }
                });
                self.totalCalls = sum(data);

                self.sum = sum;
                self.isLastPage = isLastPage;

                /////////

                function isLastPage(){
                    return self.tableParams.page() === totalPages();
                }

                function sum(data){
                    return data.length;
                }

                function totalPages(){
                    return Math.ceil(self.tableParams.total() / self.tableParams.count());
                }
            });
        })

        .controller('KbnWebitelPluginMemberListParamController', function ($scope, webitel) {
            $scope.showDomains = false;
            $scope.columns = config.columns;

            webitel.then(function (webitel) {
                $scope.showDomains = !webitel.domainSession;
                if ($scope.showDomains) {
                    webitel.getDomains(function (res) {
                        $scope.domains = res;
                    })
                };
            });

            $scope.getDomains = function () {
                //if (!$scope.showDomains) return;

            };
        })
    ;
});
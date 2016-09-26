/**
 * Created by igor on 11.06.16.
 */

define(function (require) {
    var typeData = require('plugins/webitel/calls/config');

    require('plugins/webitel/bower_components/ng-table/ng-table.less');
    require('plugins/webitel/bower_components/ng-table/ng-table.min');
    require('plugins/webitel/bower_components/angular-timer/dist/angular-timer.min');
    window.humanizeDuration = require('plugins/webitel/bower_components/humanize-duration/humanize-duration');
    window.moment = require('plugins/webitel/bower_components/momentjs/moment');

    var HashCollection = require('plugins/webitel/lib/hashCollection');
    var module = require('ui/modules').get('kibana/webitel/calls', ['kibana', 'ngTable']);
    
    module
        .controller('KbnWebitelCallsVisController', function ($scope, $filter, NgTableParams, webitel) {
            webitel.then(function (webitel) {

                if (Object.keys($scope.vis.params).length == 0)
                    $scope.vis.params = {fake: true};

                $scope.domainSession = webitel.domainSession;

                if ($scope.domainSession) {
                    $scope.vis.params.domain = $scope.domainSession;
                } else {
                    $scope.vis.params.domain = 'root';
                }

                var hashListChannels = new HashCollection('id');

                hashListChannels.onAdded.subscribe(function (item) {
                    if (!item.createdOn)
                        item.createdOn = Date.now();
                    item.dtmf = '';
                    data.push(item);
                    $scope.tableParams && $scope.tableParams.reload()
                });
                
                hashListChannels.onRemoved.subscribe(function (item, key) {
                    var id = data.indexOf(item);
                    if (~id) {
                        data.splice(id, 1);
                    }
                    $scope.tableParams && $scope.tableParams.reload()
                });
                
                var mapColl = {
                    "callstate": "Channel-Call-State", //+
                    "cid_name": "Caller-Caller-ID-Name", //+
                    "cid_num": "Caller-Caller-ID-Number", //+
                    "callee_num": "Caller-Callee-ID-Number",
                    "callee_name": "Caller-Callee-ID-Name",
                    "dest": "Caller-Destination-Number", //+
                    "direction": "Call-Direction", //+
                    "ip_addr": "Caller-Network-Addr", // +
                    "read_codec": "Channel-Read-Codec-Name", //+
                    "write_codec": "Channel-Write-Codec-Name", //+
                    "uuid": "Channel-Call-UUID", //+
                    "presence_data": "Channel-Presence-Data"
                };

                function updateCallParametersFromEvent(e, call) {
                    angular.forEach(mapColl, function (i, key) {
                        call[key] = e[i];
                    });
                }

                var onCallState = function(e) {
                    var call = hashListChannels.get(e["Channel-Call-UUID"]);
                    if (call) {
                        updateCallParametersFromEvent(e, call);
                        if (call.callstate == "HANGUP" && call.uuid == e['Unique-ID']) {
                            hashListChannels.remove(call.uuid)
                        }
                    } else {
                        if (e["Channel-Call-State"] && e["Channel-Call-State"].toLowerCase() == 'hangup') {
                            if(hashListChannels.get(e["Other-Leg-Unique-ID"])) {
                                hashListChannels.remove(e["Other-Leg-Unique-ID"])
                            }
                            return;
                        }
                        call = {};
                        updateCallParametersFromEvent(e, call);
                        try {
                            hashListChannels.add(call.uuid, call);
                        } catch (e) {
                            console.warn(e)
                        }
                    }

                };

                var onCallBridge = function (e) {
                    var call = hashListChannels.get(e["Channel-Call-UUID"]);
                    if (call) {
                        updateCallParametersFromEvent(e, call);
                        var leg = hashListChannels.remove(e["Bridge-A-Unique-ID"] == call.uuid ? e["Bridge-B-Unique-ID"] : e["Bridge-A-Unique-ID"])
                    }
                };
                
                var onDTMF = function (e) {
                    var call = hashListChannels.get(e["Channel-Call-UUID"]);
                    if (call) {
                        call.dtmf += e['DTMF-Digit']
                    }
                };

                $scope.eavesdrop = function (call) {
                    webitel._instance.eavesdrop(null, call.uuid, {
                        "side": null,
                        "display": call.cid_num
                    })
                };
                
                $scope.getClass = function (state) {
                    switch (state) {
                        case "ACTIVE":
                            return 'call-active';
                        case "HELD":
                            return 'call-hold';
                        default:
                            return 'call-ring'
                    }
                };
                
                $scope.useWebPhone = function () {
                    return !!webitel.domainSession
                };

                var activeDomain = null;
                
                var subscribeDomain = function (domainName) {
                    webitel.onServerEvent('SE:CHANNEL_CALLSTATE', onCallState, {all:true, domain: domainName});
                    webitel.onServerEvent('SE:CHANNEL_BRIDGE', onCallBridge, {all:true, domain: domainName});
                    webitel.onServerEvent('SE:DTMF', onDTMF, {all:true, domain: domainName});
                    activeDomain = domainName;
                };
                
                var unSubscribeDomain = function () {
                    webitel.unServerEvent('SE:CHANNEL_CALLSTATE', {all:true, domain: activeDomain}, onCallState);
                    webitel.unServerEvent('SE:CHANNEL_BRIDGE', {all:true, domain: activeDomain}, onCallBridge);
                    webitel.unServerEvent('SE:DTMF', {all:true, domain: activeDomain}, onDTMF);
                };

                $scope.$on('$destroy', function () {
                    unSubscribeDomain();
                });

                subscribeDomain(webitel.domainSession || '');

                // var data = [{"uuid":"0323b214-abe3-4e54-9823-56baf8b5723c","direction":"inbound","created":"2016-06-23 13:04:48","created_epoch":"1466687088","name":"sofia/internal/102@10.10.10.144","state":"CS_EXECUTE","cid_name":"102","cid_num":"102","ip_addr":"10.10.10.25","dest":"00","application":"conference","application_data":"10.10.10.144@default","dialplan":"XML","context":"default","read_codec":"L16","read_rate":"48000","read_bit_rate":"768000","write_codec":"opus","write_rate":"48000","write_bit_rate":"0","secure":"","hostname":"webitel","presence_id":"102@10.10.10.144","presence_data":"","accountcode":"","callstate":"ACTIVE","callee_name":"","callee_num":"","callee_direction":"","call_uuid":"","sent_callee_name":"","sent_callee_num":"","initial_cid_name":"102","initial_cid_num":"102","initial_ip_addr":"10.10.10.25","initial_dest":"00","initial_dialplan":"XML","initial_context":"default"}];
                var data = [];

                $scope.$watch('vis.params.domain', function (val, oldVal) {
                    $scope.vis.params.domain = val;
                    $scope.tableParams.reload();

                    if (val) {
                        webitel.httpApi('/api/v2/channels', function (err, res) {
                            if (err) {
                                // todo alert;
                                return console.error(err);
                            }
                            hashListChannels.removeAll();
                            if (res.row_count > 0) {
                                angular.forEach(res.rows, function (item) {
                                    item.createdOn = item.created_epoch * 1000;
                                    try {
                                        hashListChannels.add(item.uuid, item);
                                    } catch (e) {
                                        console.warn(e)
                                    }
                                });
                            }
                        })
                    }
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
                        dataset: data
                    })
            })
        })
        .controller('KbnWebitelCallsParamsController', function ($scope, webitel, $q) {
            // webitel.then(function (api) {
            //     $scope.showDomains = !api.domainSession;
            //     if (!$scope.showDomains) return;
            //
            //     api.getDomains(function (res) {
            //         $scope.domains = res;
            //     })
            // });
            $scope.showDomains = false;
            $scope.columns = typeData.columns;
            //
            // $scope.getDomains = function () {
            //
            // };
        })
});
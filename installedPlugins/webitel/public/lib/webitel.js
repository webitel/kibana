/**
 * Created by i.navrotskyj on 10.11.2015.
 * */

define(function (require) {
    var angular = require('angular');
    var HashCollection = require('plugins/webitel/lib/hashCollection');

    var Webitel = require('plugins/webitel/lib/webitelLib');
    // TODO
    require('ui/modules').get('kibana')
        .directive('wSettings', function () {
            // if (~config.plugins.indexOf('plugins/webitel_plugin/cti_panel/WebitelPanel/webitel_panel')) {
            //     return {
            //         restrict: 'EA',
            //         templateUrl: 'plugins/webitel_plugin/settings.html'
            //     };
            // } else {
            //     return {
            //         template: '<a href="./logout" style="width: 100%">\n<i class="fa fa-sign-out fa-fw"></i>Logout</a>'
            //     };
            // }
        });

    require('ui/modules').get('kibana')
        .service('webitel', function ($rootScope, $http, $q, config) {
            var deferred = $q.defer();

            $http.get('../api/webitel/v1/whoami')
                .then(function (res) {
                    
                    var webitelSession = res.data.credentials;
                    webitelSession.domain = webitelSession.username.split('@')[1];
                    webitelSession.ws = res.data.engineUri.replace(/http/,'ws');
                    webitelSession.hostname = res.data.engineUri;

                    var webitel = window.webitel = new Webitel({
                        account: webitelSession['username'],
                        debug: true,
                        reconnect: false,
                        secret: webitelSession['password'],
                        server: webitelSession['ws']
                    });
                    webitel.connect();
                    webitel.domainSession = webitelSession['domain'];

                    //webitel.onConnect(function () {
                    //    deferred.resolve({
                    //        getData: function (commandName, params, cb) {
                    //            if (!commandLinkToData[commandName]) return;
                    //
                    //            commandLinkToData[commandName].getData(params, cb);
                    //        },
                    //        getDomains: function (cb) {
                    //            if (domains.length === 0) {
                    //                webitel.domainList(function () {
                    //                    var table = this.parseDataTable(),
                    //                        res = [],
                    //                        domainIndex = table.headers.indexOf('domain');
                    //
                    //                    angular.forEach(table.data, function (item, i) {
                    //                        res.push({
                    //                            id: i,
                    //                            name: item[domainIndex]
                    //                        });
                    //                    });
                    //                    domains = res;
                    //                    cb(res);
                    //                });
                    //            } else {
                    //                cb(domains)
                    //            }
                    //        },
                    //        getQueue: hashQueue.getData,
                    //        getQueueByDomain: getQueueByDomain,
                    //        httpApi: httpApi,
                    //        onServerEvent: webitel.onServerEvent,
                    //        unServerEvent: webitel.unServerEvent,
                    //        domainSession: webitel.domainSession,
                    //        _instance: webitel
                    //    });
                    //});
                    //
                    webitel.onReady(function () {
                        deferred.resolve({
                            getData: function (commandName, params, cb) {
                                if (!commandLinkToData[commandName]) return;

                                commandLinkToData[commandName].getData(params, cb);
                            },
                            getDomains: function (cb) {
                                if (domains.length === 0) {
                                    webitel.domainList(function () {
                                        var table = this.parseDataTable(),
                                            res = [],
                                            domainIndex = table.headers.indexOf('domain');

                                        angular.forEach(table.data, function (item, i) {
                                            res.push({
                                                id: i,
                                                name: item[domainIndex]
                                            });
                                        });
                                        domains = res;
                                        cb(res);
                                    });
                                } else {
                                    cb(domains)
                                }
                            },
                            getQueue: hashQueue.getData,
                            getQueueByDomain: getQueueByDomain,
                            httpApi: httpApi,
                            onServerEvent: webitel.onServerEvent,
                            unServerEvent: webitel.unServerEvent,
                            domainSession: webitel.domainSession,
                            _instance: webitel
                        });
                    })

                    var domains = [];

                    var hashQueue = new HashCollection('id');
                    hashQueue.getData = function (domain, cb) {
                        httpApi('/api/v2/callcenter/queues?domain=' + domain, function (err, res) {
                            cb( (res && typeof res.info === 'object' && res.info) || [] );
                        });
                    };

                    var getQueueByDomain = function (domainName, cb) {
                        httpApi('/api/v2/callcenter/queues?domain=' + domainName, function (err, res) {
                            cb( (res && typeof res.info === 'object' && res.info) || [] );
                        });
                    };

                    var hashListAgent = new HashCollection('id');
                    hashListAgent.domainsInit = [];
                    hashListAgent.getDataFromDomain = function (domain) {
                        var res = [];
                        var collection = hashListAgent.collection;
                        angular.forEach(collection, function (item, key) {
                            if (key.indexOf(domain + ':') === 0)
                                res.push(item);
                        });
                        return res;
                    };
                    hashListAgent.getData = function (params, cb) {
                        var domain = params['domain'] || webitel.domainSession;
                        if (hashListAgent.domainsInit.indexOf(domain) > -1) {
                            cb(hashListAgent.getDataFromDomain(domain));
                        } else {
                            hashListAgent.domainsInit.push(domain);
                            webitel.userList(domain, function (res) {
                                if (res.status === 1) {
                                    // TODO ERROR
                                };
                                // TODO
                                var _res = res.response.response || res.response;
                                var jsonData = typeof _res == 'string' ? JSON.parse(_res) : _res;

                                angular.forEach(jsonData, function (item) {
                                    item['description'] = decodeURI(item['descript']) || '';
                                    item['name'] = item['name'] ? decodeURI(item['name']) : item.id;
                                    hashListAgent.add(item['domain'] + ":" + item['id'], item);
                                });

                                cb(hashListAgent.getDataFromDomain(domain));

                            });
                        };
                    };

                    var hashListQueue = new HashCollection('id');
                    hashListQueue.getData = function (params, cb) {
                        var res = [];
                        var collection = hashListQueue.collection;
                        angular.forEach(collection, function (item) {
                            res.push(item);
                        });
                        cb(res);
                    };


                    var commandLinkToData = {
                        'userList': hashListAgent,
                        'queueList': hashListQueue,
                        'getQueue': hashQueue,
                        'agentList': {
                            getData: function (params, cb) {
                                var scope = params.scope;
                                var domain = params.domain;
                                var queueName = scope.vis.params.queue.name;
                                httpApi('/api/v2/callcenter/queues/' + queueName + '/tiers?domain=' + domain, function (err, res) {
                                    cb( (res && typeof res.info === 'object' && res.info) || [] );
                                });
                            }
                        }
                    };


                    webitel.onServerEvent("ACCOUNT_ONLINE", function (e) {
                        var userId = e['User-Domain'] + ':' + e['User-ID'];

                        var agent = hashListAgent.get(userId);
                        if (!agent) {
                            agent = hashListAgent.add(userId, {});
                        };
                        agent['online'] = true;
                        // todo
                        $rootScope.$broadcast('webitel:changeHashListUsers', {});

                    }, false);

                    webitel.onServerEvent("ACCOUNT_OFFLINE", function (e) {
                        var userId = e['User-Domain'] + ':' + e['User-ID'];

                        var agent = hashListAgent.get(userId);
                        if (!agent) {
                            agent = hashListAgent.add(userId, {});
                        };
                        agent['online'] = false;
                        // todo
                        $rootScope.$broadcast('webitel:changeHashListUsers', {});

                    }, false);

                    webitel.onServerEvent("ACCOUNT_STATUS", function (e) {
                        var userId = e['Account-Domain'] + ':' + e['Account-User'];

                        var agent = hashListAgent.get(userId);
                        if (!agent) {
                            agent = hashListAgent.add(userId, {});
                        };
                        agent['status'] = e['Account-Status'];
                        agent['state'] = e['Account-User-State'];
                        agent['description'] = e["Account-Status-Descript"] ? decodeURI(e["Account-Status-Descript"]) : '';
                        // todo
                        $rootScope.$broadcast('webitel:changeHashListUsers', {});
                    }, false);

                    webitel.onServerEvent("USER_CREATE", function (e) {
                        var userId = e['User-Domain'] + ':' + e['User-ID'],
                            user = {
                                "id": e['User-ID'],
                                "domain": e['User-Domain'],
                                "scheme": e['User-Scheme'],
                                "state": e['User-State'],
                                "online": false,
                                "role": e['ariable_account_role']
                            };

                        hashListAgent.add(userId, user);
                        // todo
                        $rootScope.$broadcast('webitel:changeHashListUsers', {});
                    }, false);

                    webitel.onServerEvent("USER_DESTROY", function (e) {
                        var userId = e['User-Domain'] + ':' + e['User-ID'];
                        hashListAgent.remove(userId);
                        // todo
                        $rootScope.$broadcast('webitel:changeHashListUsers', {});
                    }, false);

                    function httpApi(url, cb) {
                        var req = {
                            method: 'GET',
                            url: webitelSession['hostname'] + url,
                            headers: {
                                'Content-Type': 'application/json;charset=UTF-8',
                                'x-key': webitelSession['key'],
                                'x-access-token': webitelSession['token']
                            }
                        };
                        $http(req).success(function(res){
                            cb(null, res);
                        }).error(function(e){
                            cb(e);
                        });
                    };
                });
            return deferred.promise;
        });


});
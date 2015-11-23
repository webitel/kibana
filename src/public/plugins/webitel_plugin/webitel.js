/**
 * Created by i.navrotskyj on 10.11.2015.
 * */
define('services/webitelSocket', ['require', 'text!config', 'webitelLibrary'], function(require) {
    var Webitel = require('webitelLibrary');
    var webitelSession = JSON.parse(require('text!config')).webitelSession;
    if (!webitelSession) {
        return;
    };

    var webitel = window.webitel = new Webitel({
        account: webitelSession['login'],
        debug: true,
        reconnect: false,
        secret: webitelSession['password'],
        server: webitelSession['ws']
    });
    webitel.connect();
    webitel.domainSession = webitelSession['domain'];
    return webitel;
});

define('plugins/webitel_plugin/webitel', ['require', 'angular', 'services/webitelSocket', 'text!config', 'components/webitel/hashCollection'], function (require) {
    var config = require('text!config');
    config = JSON.parse(config);
    var webitel = require('services/webitelSocket');
    var angular = require('angular');
    var HashCollection = require('components/webitel/hashCollection');
    require('modules').get('kibana')
        .service('webitel', function ($rootScope, $http, $filter, $interval, localStorage) {

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
                            item['name'] = decodeURI(item['name']) || '';
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
                agent['description'] = e["Account-Status-Descript"] ? decodeURI(decodeURI(e["Account-Status-Descript"])) : '';
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
                    url: config.webitelSession['hostname'] + url,
                    headers: {
                        'x-key': config.webitelSession['key'],
                        'x-access-token': config.webitelSession['token']
                    }
                };
                $http(req).success(function(res){
                    cb(null, res);
                }).error(function(e){
                    cb(e);
                });
            };

            return {
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
                domainSession: webitel.domainSession
            };
        });
});

define('components/webitel/event', function () {
    var WebitelEvent = function() {
        var nextSubscriberId = 0;
        var subscriberList = [];

        this.subscribe = function(callback) {
            var id = nextSubscriberId;
            subscriberList[id] = callback;
            nextSubscriberId++;
            return id;
        };

        this.unsubscribe = function(id) {
            delete subscriberList[id];
        };

        this.trigger = function(sender) {
            for (var i in subscriberList) {
                subscriberList[i](sender);
            }
        };
    };
    return WebitelEvent;
});

define('components/webitel/hashCollection', ['require', 'components/webitel/event'], function (require) {
    var WebitelEvent = require('components/webitel/event');

    var WebitelHashCollection = function() {
        var collection = {};

        var length = 0;

        var onAddedElement = new WebitelEvent();
        var onRemovedElement = new WebitelEvent();

        var addElement = function(key, element) {
            collection[key] = element;
            length++;
            onAddedElement.trigger(collection[key]);
            return collection[key];
        };

        var getLength = function() {
            return length;
        };

        var getElement = function(key) {
            return collection[key]
        };

        var removeElement = function(key) {
            if (collection[key]) {
                var removedElement = collection[key];
                delete collection[key];
                length--;
                onRemovedElement.trigger(removedElement.getJSONObject ? removedElement.getJSONObject() : removedElement);
            };
        };

        var removeAllElement = function() {
            for (var key in collection) {
                removeElement(key);
            }
        };

        var setNewKey = function(key, newKey) {
            if (collection[key]) {
                throw new Error('Key ' + key + ' not found!');
            } else {
                var element = collection[key];
                collection[newKey] = element;
                collection[key] = undefined;
                delete collection[key];
            };
        };

        return {
            add: addElement,
            get: getElement,
            remove: removeElement,
            removeAll: removeAllElement,
            setNewKey: setNewKey,
            onAdded: onAddedElement,
            onRemoved: onRemovedElement,
            length: getLength,
            collection: collection
        };
    };

    return WebitelHashCollection;
});
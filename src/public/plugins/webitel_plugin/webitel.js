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

define('components/webitel/courier', ['require', 'angular', 'services/webitelSocket', 'text!config', 'components/webitel/hashCollection'], function (require) {
	var config = require('text!config');
	config = JSON.parse(config);
	var webitel = require('services/webitelSocket');
	var angular = require('angular');
	var HashCollection = require('components/webitel/hashCollection');
	
	require('modules').get('kibana/webitel')
		.service('webitel', function ($rootScope, $http) {

			var domains = [];

			var hashQueue = new HashCollection('id');
			hashQueue.getData = function (domain, cb) {
				httpApi('/api/v2/callcenter/queues?domain=' + domain, function (err, res) {
					cb( (res && typeof res.info === 'object' && res.info) || [] );
				});
			};

			var hashListUsers = new HashCollection('id');
			hashListUsers['domainsInit'] = [];
			hashListUsers.getDataFromDomain = function (domain) {
				var res = [];
				var collection = hashListUsers.collection;
				angular.forEach(collection, function (item, key) {
					if (key.indexOf(domain + ':') === 0)
						res.push(item);
				});
				return res;
			};
			hashListUsers.getData = function (params, cb) {
				var domain = params['domain'] || webitel.domainSession;
				if (hashListUsers.domainsInit.indexOf(domain) > -1) {
					cb(hashListUsers.getDataFromDomain(domain));
				} else {
					webitel.list_users(domain, function (res) {
						if (res.status === 1) {
							// TODO ERROR
						};

						var jsonData = JSON.parse(res.response.response || res.response);

						angular.forEach(jsonData, function (item) {
							hashListUsers.add(item['domain'] + ":" + item['id'], item);
						});
						hashListUsers.domainsInit.push(domain);
						cb(hashListUsers.getDataFromDomain(domain));

					});
				};
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
					webitel.userList(domain, function (res) {
						if (res.status === 1) {
							// TODO ERROR
						};

						var jsonData = JSON.parse(res.response.response || res.response);

						angular.forEach(jsonData, function (item) {
							hashListAgent.add(item['domain'] + ":" + item['id'], item);
						});
						hashListAgent.domainsInit.push(domain);
						cb(hashListAgent.getDataFromDomain(domain));

					});
				};
			};

			var hashListQueue = new HashCollection('id');
			if (webitel.domainSession) {
				hashQueue.getData(webitel.domainSession, function (items) {
					var countRefresh = items.length,
						currentQueue = 0;
					angular.forEach(items, function (item) {
						httpApi('/api/v2/callcenter/queues/' + item['name'] + '/members?domain=' + webitel.domainSession,
						function (err, res) {
							if (err) {
								console.error(err);
							} else {
								angular.forEach(res.info, function (member) {
									if (member['state'] == "Abandoned") return;
									var rec = {
										"id": member['uuid'],
										"CC-Member-CID-Name": member['cid_name'],
										"CC-Member-CID-Number": member['cid_number'],
										"CC-Queue": member['queue']
									};
									hashListQueue.add(member['uuid'], rec);
								});
							};
							if (currentQueue++ == (countRefresh - 1)) {
								$rootScope.$broadcast('webitel:dataChange', ["queueList"]);
							};
						});
					});
				});
			};
			hashListQueue.getData = function (params, cb) {
				var res = [];
				var collection = hashListQueue.collection;
				angular.forEach(collection, function (item) {
					res.push(item);
				});
				cb(res);
			};

			var hashMembersCount = new HashCollection('id');
			hashMembersCount.getData = function (params, cb) {
				var domain = params['domain'];
				var queue = params['queue'] + '@' + domain;
				var collection = hashMembersCount.collection;
				if (collection.length == 0) {
					httpApi('/api/v2/callcenter/queues?domain=' + domain, function (err, res) {
						var queus =  (res && typeof res.info === 'object' && res.info) || [];
						angular.forEach(queus, function (item) {
							hashListAgent.add(item['name'] + '@' + item['domain'], {
								count: 0
							});
						});
						cb(hashMembersCount.get(queue).count);
					});
				} else {
					var tmp = hashMembersCount.get(queue);
					cb(tmp ? tmp.count : 0);
				};

			};


			var commandLinkToData = {
				'list_users': hashListUsers,
				'userList': hashListAgent,
				'queueList': hashListQueue,
				'getQueue': hashQueue,
				'membersCount': hashMembersCount,
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

			webitel.onServerEvent("USER_STATE", function (e) {
				var userId = e['User-Domain'] + ':' + e['User-ID'];

				var user = hashListUsers.get(userId);
				if (!user) {
					user = hashListUsers.add(userId, {});
				};
				user['state'] = e['User-State'];

				var agent = hashListAgent.get(userId);
				if (!agent) {
					agent = hashListAgent.add(userId, {});
				};
				agent['state'] = e['User-State'];

				$rootScope.$broadcast('webitel:dataChange', ["userList", "list_users"]);
			}, true);

			webitel.onServerEvent("ACCOUNT_ONLINE", function (e) {
				var userId = e['User-Domain'] + ':' + e['User-ID'];

				var user = hashListUsers.get(userId);
				if (!user) {
					user = hashListUsers.add(userId, {});
				};
				user['online'] = true;

				var agent = hashListAgent.get(userId);
				if (!agent) {
					agent = hashListAgent.add(userId, {});
				};
				agent['online'] = true;

				$rootScope.$broadcast('webitel:dataChange', ["userList", "list_users"]);
			}, true);

			webitel.onServerEvent("ACCOUNT_OFFLINE", function (e) {
				var userId = e['User-Domain'] + ':' + e['User-ID'];

				var user = hashListUsers.get(userId);
				if (!user) {
					user = hashListUsers.add(userId, {});
				};
				user['online'] = false;

				var agent = hashListAgent.get(userId);
				if (!agent) {
					agent = hashListAgent.add(userId, {});
				};
				agent['online'] = false;

				$rootScope.$broadcast('webitel:dataChange', ["userList", "list_users"]);
			}, true);

			webitel.onServerEvent("ACCOUNT_STATUS", function (e) {
				var userId = e['Account-Domain'] + ':' + e['Account-User'];

				var agent = hashListAgent.get(userId);
				if (!agent) {
					agent = hashListAgent.add(userId, {});
				};
				agent['status'] = e['Account-Status'];

				$rootScope.$broadcast('webitel:dataChange', ["userList", "list_users"]);
			}, true);

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

				hashListUsers.add(userId, user);
				hashListAgent.add(userId, user);
				$rootScope.$broadcast('webitel:dataChange', ["userList", "list_users"]);
			}, true);

			webitel.onServerEvent("USER_DESTROY", function (e) {
				var userId = e['User-Domain'] + ':' + e['User-ID'];
				hashListUsers.remove(userId);
				hashListAgent.remove(userId);
				$rootScope.$broadcast('webitel:dataChange', ["userList", "list_users"]);
			}, true);

			// CC

			webitel.onServerEvent("CC_AGENT_STATE", function (e) {
				var userId = e['User-Domain'] + ':' + e['User-ID'];
				var agent = hashListAgent.get(userId);
				if (!agent) {
					agent = hashListAgent.add(userId, {});
				};
				agent['state'] = e['CC-Agent-State'];

				$rootScope.$broadcast('webitel:dataChange', ["userList", "list_users"]);

			}, true);

			webitel.onServerEvent("CC_AGENT_STATUS", function (e) {
				var userId = e['User-Domain'] + ':' + e['User-ID'];
				var agent = hashListAgent.get(userId);
				if (!agent) {
					agent = hashListAgent.add(userId, {});
				};
				agent['status'] = e['CC-Agent-Status'];

				$rootScope.$broadcast('webitel:dataChange', ["userList", "list_users"]);

			}, true);


			webitel.onServerEvent("CC::BRIDGE-AGENT-START", function (e) {

				console.warn(e);

			});

			webitel.onServerEvent("CC::AGENT-OFFERING", function (e) {
				// 2
				var id = e['CC-Member-UUID'];
				var rec = hashListQueue.get(id);
				if (rec) {
					rec['CC-Agent'] = e['CC-Agent']
				};
				console.warn(e);

				$rootScope.$broadcast('webitel:dataChange', ["queueList"]);
			});

			webitel.onServerEvent("CC::BRIDGE-AGENT-END", function (e) {
				// 2
				var id = e['CC-Member-UUID'];
				var rec = hashListQueue.get(id);
				if (rec) {
					rec['CC-Agent'] = ''
				};
				console.warn(e);

				$rootScope.$broadcast('webitel:dataChange', ["queueList"]);
			});

			webitel.onServerEvent("CC::BRIDGE-AGENT-FAIL", function (e) {
				// 2
				var id = e['CC-Member-UUID'];
				var rec = hashListQueue.get(id);
				if (rec) {
					rec['CC-Agent'] = ''
				};
				$rootScope.$broadcast('webitel:dataChange', ["queueList"]);
				console.warn(e);
			});

			webitel.onServerEvent("CC::MEMBERS-COUNT", function (e) {
				var queue = hashMembersCount.get(e['CC-Queue']);
				if (queue) {
					queue['count'] = e['CC-Count'];
				} else {
					hashMembersCount.add(e['CC-Queue'], {
						count: e['CC-Count']
					});
				};
				$rootScope.$broadcast('webitel:dataChange', ["membersCount"]);
				console.warn(hashMembersCount.collection);
			});

			webitel.onServerEvent("CC::MEMBER-QUEUE-START", function (e) {
				// 1
				var rec = {
					"id": e["CC-Member-UUID"],
					"CC-Member-CID-Name": e["CC-Member-CID-Name"],
					"CC-Member-CID-Number": e["CC-Member-CID-Number"],
					"CC-Queue": e["CC-Queue"]
				};
				hashListQueue.add(e["CC-Member-UUID"], rec);
				console.warn(e);

				$rootScope.$broadcast('webitel:dataChange', ["queueList"]);
			});

			webitel.onServerEvent("CC::MEMBER-QUEUE-END", function (e) {
				var id = e['CC-Member-UUID'];
				hashListQueue.remove(id);

				console.warn(e);

				$rootScope.$broadcast('webitel:dataChange', ["queueList"]);
			});

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
				domainSession: webitel.domainSession
			};
		});
});

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


define('plugins/webitel_plugin/webitel_handler_type', ['require'], function(require) {
	return [
	/*{
		id: 1,
		name: 'User list',
		handleName: 'list_users',
		rowClass: 'w-online',
		columns: [
			{ title: 'Name', field: 'id', visible: true, filter: '' },
			{ title: 'domain', field: 'domain', visible: true },
			{ title: 'scheme', field: 'scheme', visible: true },
			{ title: 'online', field: 'online', visible: true, cellTemplate: "<span style='text-align: center;' class='fa fa-circle' ng-class='{\"w-online\" : item[column.field] == true, \"w-offline\" : item[column.field] != true}'></span>" },
			{ title: 'state', field: 'state', visible: true}
		]
	}, */
	{
		id: 2,
		name: 'User list',
		subType: "table",
		handleName: 'userList',
		columns: [
			{ title: 'Name', field: 'id', visible: true, filter: '' },
			{ title: 'Domain', field: 'domain', visible: true },
			{ title: 'Online', field: 'online', visible: true, cellTemplate: "<span style='text-align: center;' class='fa fa-circle' ng-class='{\"w-online\" : item[column.field] == true, \"w-offline\" : item[column.field] != true}'></span>" },
			{ title: 'Role', field: 'role', visible: true },
			{ title: 'Agent', field: 'agent', visible: true },
			{ title: 'Scheme', field: 'scheme', visible: true },
			//{ title: 'timer', field: 'timer', visible: true, cellTemplate: "<timer>{{timer}}</timer>" },
			{ title: 'State', field: 'state', visible: true, ngClass: '{"w-account-onhook" : item[column.field] == "ONHOOK" || item[column.field] == "Waiting", "w-account-nonreg": item[column.field] == "NONREG", "w-account-isbusy": item[column.field] == "ISBUSY" || item[column.field] == "In a queue call", "w-account-receiving": item[column.field] == "Receiving"}' },
			{ title: 'Status', field: 'status', visible: true },
			{ title: 'Description', field: 'descript', visible: true },
		]
	},
	{
		id: 3,
		name: "Live queue",
		subType: "table",
		handleName: "queueList",
		columns: [
			{ title: 'Caller Name', field: 'CC-Member-CID-Name', visible: true, filter: '' },
			{ title: 'Caller Number', field: 'CC-Member-CID-Number', visible: true },
			{ title: 'Queue', field: 'CC-Queue', visible: true },
			{ title: 'Agent', field: 'CC-Agent', visible: true }
		]
	},
	{
		id: 4,
		name: "Agent list",
		subType: "table",
		handleName: "agentList",
		columns: [
			{ title: 'Name', field: 'name', visible: true, filter: '' },
			{ title: 'busy_delay_time', field: 'busy_delay_time', visible: true },
			{ title: 'calls_answered', field: 'calls_answered', visible: true },
			{ title: 'last_bridge_end', field: 'last_bridge_end', visible: true },
			{ title: 'last_bridge_start', field: 'last_bridge_start', visible: true },
			{ title: 'last_offered_call', field: 'last_offered_call', visible: true },
			{ title: 'last_status_change', field: 'last_status_change', visible: true },
			{ title: 'no_answer_count', field: 'no_answer_count', visible: true },
			{ title: 'no_answer_delay_time', field: 'no_answer_delay_time', visible: true },
			{ title: 'ready_time', field: 'ready_time', visible: true },
			{ title: 'reject_delay_time', field: 'reject_delay_time', visible: true },
			{ title: 'state', field: 'state', visible: true },
			{ title: 'status', field: 'status', visible: true },
			{ title: 'talk_time', field: 'talk_time', visible: true },
			{ title: 'wrap_up_time', field: 'wrap_up_time', visible: true }
		]
	},
	{
		id: 5,
		name: "Members count",
		subType: "text",
		handleName: "membersCount"
	}
	];
});

define('plugins/webitel_plugin/webitel_plugin_vis_controller',['require', 'services/webitelSocket', 'ng-table', 'modules', 'plugins/webitel_plugin/webitel_handler_type'],function (require) {
	require('ng-table');
	var typeData = require('plugins/webitel_plugin/webitel_handler_type');

	var module = require('modules').get('kibana/webitel_plugin_vis', ['kibana']);

	module
		.controller('KbnWebitelPluginVisController', function ($scope, $filter, ngTableParams, webitel) {
			$scope.$on('$destroy', function () {
				webitelEventDataChange();
			});

			$scope.domainSession = webitel.domainSession;

			if ($scope.domainSession) {
				$scope.vis.params.domain = $scope.domainSession;
			};

			var webitelEventDataChange = $scope.$on('webitel:dataChange', function (e, data) {
				// TODO проверить нужно ли рефрешить...
				if (data && data.indexOf($scope.vis.params.type && $scope.vis.params.type.handleName) > -1) {
					if ($scope.vis.params.type.subType == 'table') {
						$scope.tableParams.reload();
					} else if ($scope.vis.params.type.subType == 'text') {
						webitel.getData($scope.vis.params.type.handleName,
							{domain: $scope.vis.params.domain, queue: $scope.vis.params.queue.name},
							function (res) {
								$scope.text = res;
							});
					}
				};
			});

			$scope.text = '0';

			$scope.$watch('vis.params.type', function (val) {
				if (!val) {
					return;
				};
				$scope.columns = val.columns;

				$scope.filtersObj = null;
				angular.forEach($scope.columns, function (item) {
					if (item['filter'] && item['filter'] != '') {
						if (!$scope.filtersObj) $scope.filtersObj = {};
						$scope.filtersObj[item['field']] = item['filter'];
					}
				});

				$scope.vis.params.defSorting = null;
				// TODO
				$scope.tableParams.reload();
				$scope.vis.params.type = val;
			});

			$scope.$watch('vis.params.domain', function (val) {
				$scope.vis.params.domain = val;
				if ($scope.vis.params.type.subType == 'table')
					$scope.tableParams.reload();
			});

			$scope.$watch('vis.params.top', function (val) {
				if (val > 0) {
					$scope.tableParams.count(val)
				}
			});
			$scope.isGroupBy = false;
			$scope.hasSomeRows = true;
			$scope.tableParams = new ngTableParams({
					page: 1,
					count: 5
				},
				{
					counts: [],
					groupBy: 'asd',
					//total: 10,
					getData: function($defer, params) {
						if (!$scope.vis.params.type) return;

						webitel.getData($scope.vis.params.type.handleName, {domain: $scope.vis.params.domain, scope: $scope}, function (res) {
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
							params.total(data.length);
							//if ($scope.vis.params.top > 0) {
							//	params.count($scope.vis.params.top);
							//} else {
							//	params.count(data.length + 1);
							//};

							$defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
						});
					}
			});

		})
		.directive("timer", function($interval) {
			return {
				restrict: "E",
				transclude: true,
				template: '<div ng-transclude></div>',
				link: function ($scope, element) {
					var interval, incrementTimer, actions;
					actions = { start: "Start", stop: "Stop" };

					$scope.timer = 0;
					$scope.action = actions.start;

					incrementTimer = function() {
						$scope.timer += 1;
					};

					$scope.toggle = function toggle() {
						if ($scope.action === actions.start) {
							$scope.action = actions.stop;
							interval = $interval(incrementTimer, 1000);

						} else if ($scope.action === actions.stop) {
							$scope.action = actions.start;
							$interval.cancel(interval);
						}
					};
					$scope.toggle();

					$scope.reset = function () {
						$interval.cancel(interval);
						$scope.timer = 0;
						$scope.action = actions.start;
					};
				}
			}
		})
		.directive('htmldiv', function($compile, $parse) {
			return {
				restrict: 'E',
				link: function(scope, element, attr) {
					scope.$watch(attr.content, function() {
						element.html($parse(attr.content)(scope));
						$compile(element.contents())(scope);
					}, true);
				}
			}
		})

		.controller('KbnWebitelPluginTypeController', function($scope, webitel) {
			$scope.typeData = typeData;
			$scope.showDomains = !webitel.domainSession;

			$scope.getQueue = function () {
				webitel.getQueue(webitel.domainSession, function (res) {
					$scope.queueData = res;
				});
			};
			$scope.getDomains = function () {
				webitel.getDomains(function (res) {
					$scope.domains = res;
				})
			};
	});
});

define('plugins/webitel_plugin/webitel_plugin_vis',['require', 'services/webitelSocket', 'css!plugins/webitel_plugin/webitel_plugin.css','plugins/webitel_plugin/webitel_plugin_vis_controller','plugins/vis_types/template/template_vis_type','text!plugins/webitel_plugin/webitel_plugin_vis.html','text!plugins/webitel_plugin/webitel_plugin_vis_params.html'],
		function (require) {

	// we need to load the css ourselves
	require('css!plugins/webitel_plugin/webitel_plugin.css');

	// we also need to load the controller and used by the template
	require('plugins/webitel_plugin/webitel_plugin_vis_controller');


	return function (Private) {
		var TemplateVisType = Private(require('plugins/vis_types/template/template_vis_type'));

		// return the visType object, which kibana will use to display and configure new
		// Vis object of this type.
		return new TemplateVisType({
			name: 'WebitelSocket',
			title: ' Socket table',
			icon: 'fa-users',
			description: 'Webitel socket event listener.',
			template: require('text!plugins/webitel_plugin/webitel_plugin_vis.html'),
			params: {
				editor: require('text!plugins/webitel_plugin/webitel_plugin_vis_params.html')
			},
			requiresSearch: false
		});
	};
});

// Init
define('plugins/webitel_plugin/index',['require','registry/vis_types','plugins/webitel_plugin/webitel_plugin_vis'],function (require) {
	//require('registry/vis_types').register(function (Private) {
	//	return Private(require('plugins/webitel_plugin/webitel_plugin_vis'));
	//});
});

// END IGOR
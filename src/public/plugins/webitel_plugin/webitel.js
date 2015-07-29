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

define('components/webitel/courier', ['require', 'angular', 'services/webitelSocket', 'components/webitel/hashCollection'], function (require) {
	var webitel = require('services/webitelSocket');
	var angular = require('angular');
	var HashCollection = require('components/webitel/hashCollection');
	
	require('modules').get('kibana/webitel')
		.service('webitel', function ($rootScope) {

			var domains = [];

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
			hashListQueue.getData = function (params, cb) {
				var res = [];
				var collection = hashListQueue.collection;
				angular.forEach(collection, function (item) {
					res.push(item);
				});
				cb(res);
			};

			var commandLinkToData = {
				'list_users': hashListUsers,
				'userList': hashListAgent,
				'queueList': hashListQueue
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

				console.error(e);

			});

			webitel.onServerEvent("CC::AGENT-OFFERING", function (e) {
				// 2
				var id = e['CC-Member-Session-UUID'];
				var rec = hashListQueue.get(id);
				if (rec) {
					rec['CC-Agent'] = e['CC-Agent']
				};
				console.error(e);

				$rootScope.$broadcast('webitel:dataChange', ["queueList"]);
			});

			webitel.onServerEvent("CC::BRIDGE-AGENT-END", function (e) {
				// 2
				var id = e['CC-Member-Session-UUID'];
				var rec = hashListQueue.get(id);
				if (rec) {
					rec['CC-Agent'] = ''
				};
				console.error(e);

				$rootScope.$broadcast('webitel:dataChange', ["queueList"]);
			});

			webitel.onServerEvent("CC::BRIDGE-AGENT-FAIL", function (e) {
				// 2
				var id = e['CC-Member-Session-UUID'];
				var rec = hashListQueue.get(id);
				if (rec) {
					rec['CC-Agent'] = ''
				};
				console.error(e);

				$rootScope.$broadcast('webitel:dataChange', ["queueList"]);
			});

			webitel.onServerEvent("CC::MEMBERS-COUNT", function (e) {
				console.error(e);
			});

			webitel.onServerEvent("CC::MEMBER-QUEUE-START", function (e) {
				// 1
				var rec = {
					"id": e["CC-Member-Session-UUID"],
					"CC-Member-CID-Name": e["CC-Member-CID-Name"],
					"CC-Member-CID-Number": e["CC-Member-CID-Number"],
					"CC-Queue": e["CC-Queue"]
				};
				hashListQueue.add(e["CC-Member-Session-UUID"], rec);
				console.error(e);

				$rootScope.$broadcast('webitel:dataChange', ["queueList"]);

				console.error(e);
			});

			webitel.onServerEvent("CC::MEMBER-QUEUE-END", function (e) {
				var id = e['CC-Member-Session-UUID'];
				hashListQueue.remove(id);

				console.error(e);

				$rootScope.$broadcast('webitel:dataChange', ["queueList"]);
			});


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

	var webitel = new Webitel({
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
	return [{
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
	}, {
		id: 2,
		name: 'Agent list',
		handleName: 'userList',
		columns: [
			{ title: 'Name', field: 'id', visible: true, filter: '' },
			{ title: 'domain', field: 'domain', visible: true },
			{ title: 'online', field: 'online', visible: true, cellTemplate: "<span style='text-align: center;' class='fa fa-circle' ng-class='{\"w-online\" : item[column.field] == true, \"w-offline\" : item[column.field] != true}'></span>" },
			{ title: 'role', field: 'role', visible: true },
			{ title: 'scheme', field: 'scheme', visible: true },
			//{ title: 'timer', field: 'timer', visible: true, cellTemplate: "<timer>{{timer}}</timer>" },
			{ title: 'state', field: 'state', visible: true, ngClass: '{"w-account-onhook" : item[column.field] == "ONHOOK" || item[column.field] == "Waiting", "w-account-nonreg": item[column.field] == "NONREG", "w-account-isbusy": item[column.field] == "ISBUSY" || item[column.field] == "In a queue call", "w-account-receiving": item[column.field] == "Receiving"}' },
			{ title: 'status', field: 'status', visible: true },
			{ title: 'descript', field: 'descript', visible: true },
		]
	}, {
		id: 3,
		name: "Live queue",
		handleName: "queueList",
		columns: [
			{ title: 'Caller Name', field: 'CC-Member-CID-Name', visible: true, filter: '' },
			{ title: 'Caller Number', field: 'CC-Member-CID-Number', visible: true },
			{ title: 'Queue', field: 'CC-Queue', visible: true },
			{ title: 'Agent', field: 'CC-Agent', visible: true },
			//{ title: 'scheme', field: 'scheme', visible: true },
			//{ title: 'state', field: 'state', visible: true },
		]
	}];
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
					$scope.tableParams.reload();
				};
			});

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
				
				$scope.tableParams.reload();
				$scope.vis.params.type = val;
			});

			$scope.$watch('vis.params.domain', function (val) {
				$scope.vis.params.domain = val;
				$scope.tableParams.reload();
			});

			$scope.$watch('vis.params.top', function (val) {
				if (val > 0) {
					$scope.tableParams.count(val)
				}
			});

			$scope.hasSomeRows = true;
			$scope.tableParams = new ngTableParams({
					page: 1,
					count: 5
				},
				{
					counts: [],
					//total: 10,
					getData: function($defer, params) {
						if (!$scope.vis.params.type) return;

						webitel.getData($scope.vis.params.type.handleName, {domain: $scope.vis.params.domain}, function (res) {
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
			$scope.getDomains = function () {
				webitel.getDomains(function (res) {
					$scope.domains = res;
				})
			}
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
	require('registry/vis_types').register(function (Private) {
		return Private(require('plugins/webitel_plugin/webitel_plugin_vis'));
	});
});

// END IGOR
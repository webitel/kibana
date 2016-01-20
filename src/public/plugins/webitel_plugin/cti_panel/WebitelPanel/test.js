Ext.ns('ext-base');
Ext.ns('Terrasoft.integration');
Ext.ns('Terrasoft.integration.telephony');
Ext.ns('Terrasoft.integration.telephony.webitel');
Ext.define('Terrasoft.integration.telephony.webitel.WebitelCtiProvider', {
        extend: 'Terrasoft.BaseCtiProvider',
        alternateClassName: 'Terrasoft.WebitelCtiProvider',
        singleton: true,
        deviceId: '',
        isConnect: false,
        activeCall: null,
        licInfoKeys: ["MessagingService.Use", "WebitelCallManager.Use"],
        msgUtilServiceUrl: '../ServiceModel/MsgUtilService.svc/',
        loginMethodName: 'LogInMsgServer',
        updateCallMethodName: 'UpdateCall',
        isSipAutoAnswerHeaderSupported: true,
        isOperator: false,
        isUseWebRtc: false,
        isUseVideo: false,
        ringPlay: null,
        outgoingPlay: null,
        localizable: {},
        queryCall: [],
        consultCallNumber: null,
        webrtcSession: [],

        connectedCallFeaturesSet: Terrasoft.CallFeaturesSet.CAN_HOLD |
        Terrasoft.CallFeaturesSet.CAN_MAKE_CONSULT_CALL |
        Terrasoft.CallFeaturesSet.CAN_BLIND_TRANSFER | Terrasoft.CallFeaturesSet.CAN_DROP |
        Terrasoft.CallFeaturesSet.CAN_DTMF,

        callServiceMethodUsr: function(ajaxProvider, methodName, callback, dataSend) {
            var data = dataSend || {};
            var requestUrl = Terrasoft.workspaceBaseUrl + '/rest/WGetUserConnectionServices/' + methodName;
            var request = ajaxProvider.request({
                url: requestUrl,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                jsonData: data,
                callback: function(request, success, response) {
                    var responseObject = {};
                    if (success) {
                        responseObject = Terrasoft.decode(response.responseText);
                    }
                    callback.call(this, responseObject);
                },
                scope: this
            });
            return request;
        },

        connect: function (config) {
            this.setVisibleStatus();
            if (window.webitel && window.webitel.ctiProvider && window.webitel.ctiProvider.isConnect) {
                return
            };

            Terrasoft.SysSettings.querySysSettings(["webitelWebrtcConnectionString"],
                function(settings) {
                    config.webRtcServer = settings.webitelWebrtcConnectionString;

                    this.callServiceMethodUsr(Terrasoft.AjaxProvider, 'GetUsrConnection',
                        function (responseObject) {
                            var scope = this;
                            require(['WebitelModule'], function() {
                                var connection = responseObject.GetUsrConnectionResult;
                                if (!connection.login) {
                                    console.log('Error: Settings not found.');
                                    return;
                                };
                                config.login = connection.login;
                                config.password = connection.password;
                                config.url = connection.url;
                                config.domain = connection.domain;

                                if (config.isUseWebRtc !== false) {
                                    require(['WebitelVerto'], function() {
                                        scope.afterConnect(config);
                                    });
                                } else {
                                    scope.afterConnect(config);
                                };
                            });
                        },  {
                            wServerId: config.url || Terrasoft.GUID_EMPTY,
                            userId: Terrasoft.SysValue.CURRENT_USER_CONTACT.value,
                            webRtcServerId: Terrasoft.GUID_EMPTY,
                            deviceId : Terrasoft.GUID_EMPTY
                        });
                }, this
            );

        },

        afterConnect: function(config) {
            this.isSipAutoAnswerHeaderSupported = (config.isSipAutoAnswerHeaderSupported !== false);
            window.webitel = {};

            this.isUseWebRtc = config.isUseWebRtc || false;
            var webrtcConfig = false;
            this.isUseVideo = config.isUseVideo;
            var vertoRecordFile = '';
            if (this.isUseWebRtc) {
                try {
                    Terrasoft.SysSettings.querySysSettingsItem('WCallServerRecordLink', function(value) {
                        this.ringPlay = new Audio(value + 'sounds/incoming.ogg');
                        this.outgoingPlay = new Audio(value + 'sounds/outgoing-call2.ogg');
                        vertoRecordFile = value + 'sounds/incoming.ogg'
                    }, this);
                } catch (e) {};
                require(['WVideoModule', 'css!WVideoModule'], function(WVideoModule) {
                    window.webitel.video = WVideoModule.createVideoContainer(Ext.getBody(),
                        config.isUseVideo);
                    window.webitel.video.setVisible(false);
                });
                webrtcConfig = {
                    ws_servers: config.webRtcServer,
                    login: config.login,
                    password: config.password,
                    stun_servers: [],
                    vertoRecordFile: vertoRecordFile
                }
            };

            window.webitel = Webitel( {
                server: config.url,
                account: config.login,
                secret: config.password,
                reconnect: 5,
                debug: config.debugMode || false,
                webrtc: webrtcConfig,
                domain: config.domain,
                autoAnswerParam: 'sip_auto_answer=true'
            });
            window.webitel.configUser = config;

            this.getLocalizable();

            this.deviceId = config.login.toString().split('@')[0];
            this.isAutoLogin = config.isAutoLogin;

            window.webitel.ctiProvider = this;
            this.subscribeOnWebitelEvents();
            try {
                window.webitel.connect();
            } catch(e) {
                this.ConnectError({
                    errorCode: e.message,
                    errorMessage: e.message
                });
            }
        },

        queryActiveCallSnapshot: function() {},

        setVisibleStatus: function () {
            try {
                var currentStatus = Ext.getCmp('operatorStatus');
                currentStatus.menu.items.collection.each(function(item){
                    if (item.tag === 'inTalk') {
                        item.setVisible(false);
                    }
                });
            } catch (e) {
                console.log(e);
            }
        },

        getLocalizable: function() {
            require(['WebitelCtiProviderResources'], function(resources) {
                window.webitel.ctiProvider.localizable = {
                    AggentStatusTalk: resources.localizableStrings.AggentStatusTalk,
                    NumberName: resources.localizableStrings.Number
                }
            });
        },

        getDirection: function (call) {
            return call['direction'] === WebitelCallDirectionTypes.Inbound
                ? Terrasoft.CallDirection.IN
                : Terrasoft.CallDirection.OUT
        },

        insertStatusLog: function(statusCode, sync) {
            var status = Terrasoft.CtiModel.get('AgentStates').find(statusCode);
            if (!status) return;
            var _account = webitel.account();

            if (status.code == "ONHOOK" && _account['away'] != 'NONE')
                return;

            var AJAX=new XMLHttpRequest();
            AJAX.open("GET", Terrasoft.workspaceBaseUrl + '/rest/WAgentService/SetAgentStatus?agent='+
                Terrasoft.SysValue.CURRENT_USER_CONTACT.value +'&number=' +
                this.deviceId + '&status=' + status.value, sync);
            try {
                AJAX.send(null);
            } catch (e) {}
        },
        setAccountStatusTalk: function () {
            var provider = window.webitel.ctiProvider;
            provider.fireEvent('agentStateChanged', 'inTalk');
        },

        subscribeOnWebitelEvents: function() {

            window.webitel.onUserStatusChange(function(agent){
                var provider = window.webitel.ctiProvider;
                if (agent.id !== window.webitel.account().id) {
                    return;
                };
                provider.isConnect = agent.online;

                if (!provider.isConnect) {
                    provider.fireEvent('agentStateChanged', 'NotLogged');
                    return
                }
                if (agent.state == WebitelAccountStatusTypes.Busy && (Ext.isEmpty(agent.away)
                    || agent.away == WebitelUserAwayCauseTypes.None)) {
                    provider.setAccountStatusTalk();
                    return;
                }

                if (agent.state == WebitelAccountStatusTypes.Ready) {
                    provider.fireEvent('agentStateChanged', agent.state);
                } else {
                    provider.fireEvent('agentStateChanged', agent.away);
                }
            });

            window.webitel.onNewCall(function(wCall){
                var that = webitel.ctiProvider;

                if (that.activeCall && (that.consultCall || wCall.direction === WebitelCallDirectionTypes.Inbound)) {
                    if (that.debugMode) {
                        that.log("Hangup on new call: {0}", Ext.encode(wCall));
                    }
                    that.webitel.hangup(wCall.uuid, "USER_BUSY");
                    return;
                }

                var callId = wCall['uuid'];
                var isConsultCall = !Ext.isEmpty(that.activeCall);

                var call = Ext.create('Terrasoft.integration.telephony.Call');
                call.id = callId;
                call.direction = that.getCallDirection(wCall);
                call.deviceId = that.deviceId;

                call.calledId =  wCall['calleeNumber'];
                call.callerId = wCall['callerNumber'];

                call.otherLegUUID = wCall['other-leg-unique-id'];

                call.ctiProvider = that;
                call.timeStamp = new Date();
                call.callFeaturesSet = Terrasoft.CallFeaturesSet.NONE;

                call.state = Terrasoft.GeneralizedCallState.ALERTING;
                if (isConsultCall) {
                    call.redirectingId = that.deviceId;
                    call.redirectionId = (call.direction === Terrasoft.CallDirection.OUT) ? call.calledId : call.callerId;
                    that.consultCall = call;
                } else {
                    call.callFeaturesSet = Terrasoft.CallFeaturesSet.CAN_DROP;
                    if (call.direction === Terrasoft.CallDirection.IN && (that.isSipAutoAnswerHeaderSupported || that.isUseWebRtc)) {
                        call.callFeaturesSet |= Terrasoft.CallFeaturesSet.CAN_ANSWER;
                    };
                    that.activeCall = call;
                };
                that.updateDbCall(call, that.onUpdateDbCall);
                that.fireEvent('callStarted', call);
                that.fireEvent('lineStateChanged', {
                    callFeaturesSet: call.callFeaturesSet
                });
                if (call.direction === Terrasoft.CallDirection.IN) {
                    try {
                        that.ringPlay.play();
                    } catch (e) {}
                }
            });

            window.webitel.onHangupCall(function(arg){
                var that = window.webitel.ctiProvider;
                var currentCall = that.findCurrentCallById(arg['uuid']);
                if (!currentCall) {
                    return
                }
                var callId = currentCall.id;
                var call;
                if (Ext.isEmpty(callId)) {
                    call = that.activeCall;
                    that.activeCall = null;
                } else {
                    if (!Ext.isEmpty(that.activeCall) && that.activeCall.id === callId) {
                        call = that.activeCall;
                        that.activeCall = null;
                    } else if (!Ext.isEmpty(that.consultCall) && that.consultCall.id === callId) {
                        call = that.consultCall;
                        that.consultCall = null;
                        that.fireEvent('currentCallChanged', that.activeCall);
                    }
                }
                if (Ext.isEmpty(call)) {
                    that.fireEvent('lineStateChanged', {callFeaturesSet: Terrasoft.CallFeaturesSet.CAN_DIAL});
                    return;
                }
                call.oldState = call.state;
                call.state = Terrasoft.GeneralizedCallState.NONE;
                call.callFeaturesSet = Terrasoft.CallFeaturesSet.CAN_DIAL;
                that.fireEvent('callFinished', call);
                if (!Ext.isEmpty(that.activeCall)) {
                    var uuid = (that.activeCall.NewUUID) ? that.activeCall.NewUUID : that.activeCall.id;
                    if (that.activeCall.state == Terrasoft.GeneralizedCallState.HOLDED) {
                        webitel.unhold(uuid);
                    }
                } else {
                    if (!Ext.isEmpty(that.consultCall)) {
                        that.activeCall = that.consultCall;
                        that.consultCall = null;
                        that.fireEvent('currentCallChanged', that.activeCall);
                    } else {
                        that.fireEvent('lineStateChanged', {callFeaturesSet: call.callFeaturesSet});
                    }
                }
                that.updateDbCall(call, that.onUpdateDbCall);
                if (call.NewUUID) {
                    that.updateIntegrationID(call.id, call.NewUUID);
                }
            });

            window.webitel.onAcceptCall(function(arg){
                var that = window.webitel.ctiProvider;

                var currentCall = that.findCurrentCallById(arg['uuid']);
                if (!currentCall) {
                    return
                };
                var callId = currentCall.id;
                var call;

                var activeCallExists = !Ext.isEmpty(that.activeCall);
                if (activeCallExists && that.activeCall.id === callId) {
                    call = that.activeCall;
                } else if (!Ext.isEmpty(that.consultCall) && that.consultCall.id === callId) {
                    call = that.consultCall;
                    if (activeCallExists) {
                        that.activeCall.callFeaturesSet = Terrasoft.CallFeaturesSet.CAN_COMPLETE_TRANSFER;
                    }
                }
                if (Ext.isEmpty(call)) {
                    return;
                }
                call.callFeaturesSet = Terrasoft.CallFeaturesSet.CAN_DROP |
                    Terrasoft.CallFeaturesSet.CAN_HOLD |
                    Terrasoft.CallFeaturesSet.CAN_MAKE_CONSULT_CALL |
                    Terrasoft.CallFeaturesSet.CAN_BLIND_TRANSFER;
                call.oldState = call.state;
                call.state = Terrasoft.GeneralizedCallState.CONNECTED;
                if (call.oldState === Terrasoft.GeneralizedCallState.ALERTING) {
                    that.fireEvent('commutationStarted', call);
                }
                if (activeCallExists) {
                    that.fireEvent('lineStateChanged', {callFeaturesSet: that.activeCall.callFeaturesSet});
                }
                that.updateDbCall(call, that.onUpdateDbCall);
            });

            window.webitel.onHoldCall(function (arg) {
                var that = window.webitel.ctiProvider;
                var currentCall = that.findCurrentCallById(arg['uuid']);
                if (!currentCall) {
                    return
                }
                that.fireEvent('rawMessage', 'onHoldStateChange: ' + Terrasoft.encode('hold'));
                var call = that.findCurrentCallById(arg['uuid']);
                if (Ext.isEmpty(call)) {
                    var message = 'Holded activeCall is empty';
                    that.logError("onHoldStateChange: {0}", message);
                    return;
                }
                call.state = Terrasoft.GeneralizedCallState.HOLDED;
                that.activeCall.state = Terrasoft.GeneralizedCallState.HOLDED;
                call.callFeaturesSet = Terrasoft.CallFeaturesSet.CAN_UNHOLD |
                    Terrasoft.CallFeaturesSet.CAN_MAKE_CONSULT_CALL;
                that.fireEvent('hold', call);
                that.updateDbCall(call, that.onUpdateDbCall);
                that.fireEvent('lineStateChanged', {callFeaturesSet: call.callFeaturesSet});
            });

            window.webitel.onUnholdCall(function (arg) {
                var that = window.webitel.ctiProvider;
                var currentCall = that.findCurrentCallById(arg['uuid']);
                if (!currentCall) {
                    return
                }
                that.fireEvent('rawMessage', 'onHoldStateChange: ' + Terrasoft.encode('hold'));
                var call = that.findCurrentCallById(arg['uuid']);
                if (Ext.isEmpty(call)) {
                    var message = 'Holded activeCall is empty';
                    that.logError("onHoldStateChange: {0}", message);
                    return;
                }
                call.state = Terrasoft.GeneralizedCallState.CONNECTED;
                call.callFeaturesSet = that.connectedCallFeaturesSet;
                that.fireEvent('unhold', call);
                that.updateDbCall(call, that.onUpdateDbCall);
                that.fireEvent('lineStateChanged', {callFeaturesSet: call.callFeaturesSet});
            });

            window.webitel.onBridgeCall(function(webitelCall) {
                var provider = window.webitel.ctiProvider;
                var callId = webitelCall['uuid'];
                var call = provider.findCurrentCallById(callId);
                if (!call || (provider.consultCall && callId == provider.consultCall.id)) {
                    return
                };
                call.otherLegUUID = (webitelCall['call-channel-uuid'] == webitelCall['bridge-A-Unique-ID'])
                    ? webitelCall['bridge-B-Unique-ID']
                    : webitelCall['bridge-A-Unique-ID'];

                if (call.direction != Terrasoft.CallDirection.IN) {
                    call.calledId = webitelCall['calleeNumber']
                } else {
                    call.callerId = webitelCall['calleeNumber'];
                }

                Terrasoft.CtiModel.identifyCall(webitelCall['calleeNumber'], false);

                provider.updateDbCall(call);
            });

            window.webitel.onUnBridgeCall(function (arg) {
            });

            window.webitel.onUuidCall(function (arg) {
                var that = webitel.ctiProvider;
                var call = that.findCurrentCallById(arg.call['uuid']);
                if (call) {
                    that.updateIntegrationID(call.id, arg.newId);
                }
            });

            window.webitel.onConnect(function() {
                var provider = window.webitel.ctiProvider;
                if (provider.isAutoLogin) {
                    window.webitel.login();
                };
                provider.fireEvent('initialized', provider);
                provider.fireEvent('rawMessage', 'Connected');
                provider.fireEvent('agentStateChanged', 'ready');
            });

            window.webitel.onDisconnect(function(){
                var provider = window.webitel.ctiProvider;
                provider.fireEvent('rawMessage', 'Disconnected');
                provider.fireEvent('disconnected', 'Disconnected');

            });

            window.webitel.onError(function(arg){
                console.log('======================================= Error =====================================');
                window.webitel.ctiProvider.fireEvent('error', arg);
            })

            window.webitel.onNewWebRTCCall(function(session) {
                session.params.tag = webitel.video.addIncVideo(session.callID);
            })

            window.webitel.onDestroyWebRTCCall(function(session) {
                var videoTag = document.getElementById('IncomingVideo-' + session.callID);
                if (videoTag) videoTag.remove();
            })
        },

        findCurrentCallById: function(callId) {
            if (!Ext.isEmpty(this.consultCall) && (this.consultCall.id === callId || this.consultCall.NewUUID === callId)) {
                return this.consultCall;
            } else if (!Ext.isEmpty(this.activeCall) && (this.activeCall.id === callId || this.activeCall.NewUUID === callId)) {
                return this.activeCall;
            }
            return null;
        },

        getCallDirection: function(webitelCall){
            return (webitelCall['direction'] ==
            WebitelCallDirectionTypes.Inbound) ? Terrasoft.CallDirection.IN : Terrasoft.CallDirection.OUT;
        },

        loginMsgService: function(url, jsonData) {
            Terrasoft.AjaxProvider.request({
                url: url,
                scope: this,
                callback: this.onLoginMsgService,
                jsonData: jsonData
            });
        },

        updateDbCall: function(call) {
            Terrasoft.AjaxProvider.request({
                url: this.msgUtilServiceUrl + this.updateCallMethodName,
                scope: this,
                callback: this.onUpdateDbCall,
                jsonData: call.serialize()
            });
        },

        makeCall: function(number) {
            try {
                window.webitel.call(number, this.isUseVideo);
            } catch (e) {
                console.log(e.message);
            }
        },

        answerCall: function(call) {
            webitel.answer(call.id, this.isUseVideo);
        },

        dropCall: function(call) {
            webitel.hangup(call.id);
        },

        makeConsultCall: function(call, targetAddress) {
            if (call.state == Terrasoft.GeneralizedCallState.HOLDED) {
                window.webitel.attendedTransfer(call.id, targetAddress);
            } else {
                webitel.hold(call.id, function () {
                    window.webitel.attendedTransfer(call.id, targetAddress);
                });
            }
        },

        cancelTransfer: function(currentCall, consultCall) {
            webitel.cancelTransfer(currentCall.id, consultCall.id);
        },

        transferCall: function(currentCall, consultCall) {
            window.webitel.bridgeTransfer(currentCall.id, consultCall.id)
        },

        holdCall: function(call) {
            webitel.toggleHold(call.id);
        },

        blindTransferCall: function(call, targetAddress) {
            webitel.transfer(call.id, targetAddress);
        },

        queryAgentState: function() {

        },
        queryUserState: function() {

        },
        setCallForwardingNumber: function() {
            var callback = function(returnCode, controlData) {

                if (returnCode === 'ok' && !Ext.isEmpty(controlData.number.value)) {
                    window.webitel.busy(WebitelUserAwayCauseTypes.CallForwarding,
                        controlData.number.value.toString());
                }
            };

            Terrasoft.utils.inputBox(this.localizable.NumberName,
                callback,
                ['ok', 'cancel'],
                this,
                {
                    number: {
                        dataValueType: Terrasoft.DataValueType.INTEGER,
                        caption: this.localizable.NumberName,
                        value: '',
                        renderTo: 'custom-container'
                    }
                }
            );

        },
        setUserState: function(code) {
            code = code
                ? code.toUpperCase()
                : '';
            var provider = window.webitel.ctiProvider;
            if (!provider.isConnect) {
                window.webitel.login(function () {
                    provider.setUserState(code);
                });
                // this.setLoggedVisibleStatus();
                provider.isConnect = true;
            } else if (code == 'NOTLOGGED' && provider.isConnect) {
                if (!this.activeCall) {
                    window.webitel.logout();
                    provider.isConnect = false;
                }
                return;
            } else if (code == WebitelAccountStatusTypes.Ready && provider.isConnect) {
                window.webitel.ready();
            } else if (code === WebitelUserAwayCauseTypes.CallForwarding) {
                this.setCallForwardingNumber();
            } else {
                window.webitel.busy(code)
            }
        },

        disconnected: function() {
            window.webitel.disconnect();
        },

        onLoginMsgService: function(request, success, response) {
            if (success) {
                this.connect(this.initialConfig.connectionConfig);
            } else {
                this.fireEvent('rawMessage', 'LogInMsgService error');
                var errorInfo = {
                    internalErrorCode: null,
                    data: response.responseText,
                    source: 'App server',
                    errorType: Terrasoft.MsgErrorType.AUTHENTICATION_ERROR
                };
                this.fireEvent('error', errorInfo);
            };
        },

        onUpdateDbCall: function(request, success, response) {
            var callDatabaseUid = Terrasoft.decode(response.responseText);
            if (success && Terrasoft.isGUID(callDatabaseUid)) {
                var call = Terrasoft.decode(request.jsonData);

                if (!Ext.isEmpty(this.activeCall) && (this.activeCall.id === call.id || this.activeCall.NewUUID === call.id)) {
                    call = this.activeCall;
                } else if (!Ext.isEmpty(this.consultCall) && (this.consultCall.id === call.id || this.consultCall.NewUUID === call.id)) {
                    call = this.consultCall;
                }
                call.databaseUId = callDatabaseUid;
                this.fireEvent('callSaved', call);
            } else {
                this.fireEvent('rawMessage', 'Update Call error');
                var errorInfo = {
                    internalErrorCode: null,
                    data: response.responseText,
                    source: 'App server',
                    errorType: Terrasoft.MsgErrorType.COMMAND_ERROR
                };
                this.fireEvent('error', errorInfo);
            }
        },

        ConnectError: function(err) {
            this.fireEvent('rawMessage', 'onConnectError: ' + Terrasoft.encode(err));
        },

        onDisconnect: function(reason) {
            Terrasoft.showConfirmation(reason.toString());
            this.fireEvent('rawMessage', 'Disconnected');
            this.fireEvent('disconnected', reason);
        },

        onStatusChange: function(newStatus, oldStatus) {
            this.fireEvent('rawMessage', 'newStatus: ' + newStatus + ' oldStatus: ' + oldStatus);
            this.fireEvent('agentStateChanged', { userState: newStatus });
        },


        init: function() {
            this.callParent(arguments);
            this.loginMsgService(this.msgUtilServiceUrl + this.loginMethodName, {
                "LicInfoKeys": this.licInfoKeys,
                "UserUId": Terrasoft.SysValue.CURRENT_USER.value
            });
        },

        setWrapUpUserState: function(isWrapUpActive, callback) {
            if (Ext.isFunction(callback)) {
                callback.call(this);
            }
        },

        getLog: function() {
            return console.log
        },

        queryLineState: function() {},

        getCapabilities: function() {
            var callCapabilities = Terrasoft.CallFeaturesSet.CAN_RECALL | Terrasoft.CallFeaturesSet.CAN_DIAL |
                Terrasoft.CallFeaturesSet.CAN_DROP |
                Terrasoft.CallFeaturesSet.CAN_HOLD | Terrasoft.CallFeaturesSet.CAN_UNHOLD |
                Terrasoft.CallFeaturesSet.CAN_COMPLETE_TRANSFER |
                Terrasoft.CallFeaturesSet.CAN_BLIND_TRANSFER | Terrasoft.CallFeaturesSet.CAN_MAKE_CONSULT_CALL |
                Terrasoft.CallFeaturesSet.CAN_DTMF;
            if (this.isSipAutoAnswerHeaderSupported) {
                callCapabilities |= Terrasoft.CallFeaturesSet.CAN_ANSWER;
            }
            var agentCapabilities = Terrasoft.AgentFeaturesSet.CAN_WRAP_UP |
                Terrasoft.AgentFeaturesSet.HAS_CALL_CENTRE_MODE;
            return {
                callCapabilities: callCapabilities,
                agentCapabilities: agentCapabilities
            };
        },

        updateIntegrationID: function(integrationId, newId) {
            var update = Ext.create("Terrasoft.UpdateQuery", {
                rootSchemaName: 'Call'
            });
            update.setParameterValue("IntegrationId", newId, 1);
            update.filters.add('IntegrationId', Terrasoft.createColumnFilterWithParameter(
                Terrasoft.ComparisonType.EQUAL, 'IntegrationId', integrationId));
            update.execute(function(response) {
                console.log('UpdateCall')
            });
        }
    }
);
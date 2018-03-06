import angular from 'angular';
import { Notifier } from 'ui/notify/notifier';

define(function (require) {
    window.WEBITEL_PANEL_JQUERY = $;
    require('plugins/webitel_main/lib/webitel');
    require('plugins/cti/js/webitel_verto');
    require('plugins/cti/js/jquery.jscrollpane.min');
    require('plugins/cti/js/jquery.simplemodal.1.4.4.min');
    require('plugins/cti/js/jquery.selectBox');
    require('plugins/cti/css/style.css');
    require('plugins/cti/css/jquery.jscrollpane.css');
    require('plugins/cti/css/jquery.selectBox.css');

    //TODO
    var WebitelUserAwayCauseTypes = {
      OnBreak: 'ONBREAK',
      CallForwarding: 'CALLFORWARD',
      VoiceMail: 'VOICEMAIL',
      DoNotDisturb: 'DND',
      None: 'NONE'
  //        OnHook: '"ONHOOK"'
    };

    var WebitelAccountStatusTypes = {
      Ready: 'ONHOOK',
      Busy: 'ISBUSY',
      Unregistered: 'NONREG'
    };

    var module = require('ui/modules').get('kibana/webitel/cti', ['kibana']);

    module.directive('ctiPanel', function () {
        return {
            link: function () {

            },
            controller: WebitelSessionController
        }
    });

    WebitelSessionController.$inject = ['$scope','$injector'];

    function WebitelSessionController($scope, $injector) {
        var webitelPanel;
        $scope.useWebphone = localStorage.getItem("useWebPhone") == 'true';
        $scope.useWebrtc = localStorage.getItem("useWebRTC") == 'true';
        $scope.useWebrtcLeft = localStorage.getItem("leftPosition") == 'true';
        $scope.CtiPanelModuleExists = true;

        if ($scope.useWebphone ) {
            setTimeout(startWebphone, 0);
        }

        $scope.startWebphone = startWebphone;


        function startWebphone() {
            if (webitelPanel ) return;

            $injector.get('webitel').then(function(w) {
                var webitelSession = w.getSession();
                if (!webitelSession.domain) return;
                w.useWebPhone = true;
                var webrtcConf = {};
                if (webitelSession) {
                    webrtcConf["login"] = webitelSession.username;
                    webrtcConf["password"] = webitelSession.password;
                    webrtcConf["ws_servers"] = webitelSession.wsWebRtc;
                    webrtcConf["vertoRecordFile"] = "/other/elegant_ringtone.mp3";
                }

                webitelPanel = WebitelPanel({
                    defUserPic: '../plugins/cti/img/t-userpic_default__img.png',
                    'instance': w._instance,
                    'notifier': new Notifier(),
                    '_is_webrtc': $scope.useWebrtc,
                    'style': $scope.useWebrtcLeft ? 'left' : null,
                    "webrtc_server": $scope.useWebrtc && webrtcConf
                });
                if ($scope.useWebrtc)
                    w._instance.initWebrtc(webrtcConf);
            })
        }
    }

    function WebitelPanel(configuration) {

        /* CONSTANTS */

        var webitel = {};

        var webrtcSession = [];

        var jQuery = $;

        var ENG_LNG = true;

        var IS_WEBRTC;

        var DEF_USER_PIC = configuration.defUserPic;
        var notifier = configuration.notifier || {
                error: function (msg) {
                    console.error(msg)
                }
            };

        var INI_WEBITEL = false;

        var CONTACT_PREF = 'webitel-agen-';

        var SERVER_URL = 'webitel/';

        var CALLFORWARDING = {};

        var CONTAINER_NAME = 'webitel-panel';

        // Constants for the dynamic data in the menu webitel_panel
        var WebitelPanelAccountStatusTypes = {
            Ready: (ENG_LNG)? 'Ready': 'Готов',
            Busy:  (ENG_LNG)? 'Busy' : 'В перерыве'
        };

        var WebitelPanelAccountAwayCauseTypes = {
            OnBreak:        (ENG_LNG)? 'On a break'      : 'В перерыве',
            //CallForwarding: (ENG_LNG)? 'Call forwarding' : 'Переадресация',
            //VoiceMail:      (ENG_LNG)? 'Voice mail'      : 'Голосовая почта',
            DoNotDisturb:   (ENG_LNG)? 'Do not disturb'  : 'Не беспокоить'
        };

        var WebitelPanelHoldState = {
            Hold: 1,
            UnHold: 0
        };

        var NUMBER = 'N/A';

        // Status Menu Section
        var DEFAULT_STATUS = 'N/A';

        var ACTION_SECTION = [{
            class: 't-status-select_mic t-status-select_mic__on',
            text: (ENG_LNG)? 'mic' : 'микрофон'
        },
            //{
            //    class: 't-status-select_can ' + (configuration['useVideoDef'] ? 't-status-select_can__on' : 't-status-select_can__off'),
            //    text: (ENG_LNG)? 'webcam' : 'камера'
            //}
        ];
        ACTION_SECTION = [];

        var STATUS_SECTION = [{
            class: 't-status__02',
            id: 'status-break',
            text: (ENG_LNG)? 'On a break' : 'в перерыве'
        }, {
            class: 't-status__01',
            id: 'status-ready',
            text: (ENG_LNG)? 'Ready' : 'готов'
        }];
        // Status Menu Section

        // All current calls will go to the AlertMenuObjectsArray
        var AlertMenuObjectsArray = [];
        var COUNT_RECENT_EVENTS = '123';
        var RECENT_EVENTS = [];
        var MAIL_EVENTS = [];
        var FAVOURITES = [];
        var BOOK_LIST = [];
        var CONFERENCE_EVENTS = [];

        /* CONSTANTS */

        // EVENTS
        var WebitelPanelEvents = function() {
            var nextSubscriberId = 0;
            var subscriberList = [];

            this.getSubscriberList = function () {
                return subscriberList.length;
            };
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
        // IGOR
        var OnSettingsChange = new WebitelPanelEvents();
        var OnUseVideoChange = new WebitelPanelEvents();
        var OnTransferCall = new WebitelPanelEvents();
        var OnStatusChange = new WebitelPanelEvents();
        var OnNewCall = new WebitelPanelEvents();
        var OnHangUpCall = new WebitelPanelEvents();
        var OnCallForwarding = new WebitelPanelEvents();
        var OnHoldCall = new WebitelPanelEvents();
        var OnRetrieveCall = new WebitelPanelEvents();
        var OnAcceptCall = new WebitelPanelEvents();
        // EVENTS

        var MicControlStatus = {
            On: 1,
            Off: 0
        };

        var VideoControlStatus = {
            On: true,
            Off: false
        };

        // MicControl
        var MicControl = {
            currentStatus: MicControlStatus.On,
            onMute: new WebitelPanelEvents(),
            onUnMute: new WebitelPanelEvents(),
            mute: function() {
                MicControl.currentStatus = MicControlStatus.Off;
                MicControl.onMute.trigger();
            },
            unMute: function() {
                MicControl.currentStatus = MicControlStatus.On;
                MicControl.onUnMute.trigger();
            },
            status: function() {
                return MicControl.currentStatus;
            }
        };
        // MicControl

        // VideoControl
        var VideoControl = {
            currentStatus: ((configuration['useVideoDef']) ? VideoControlStatus.On : VideoControlStatus.Off),
            onHide: new WebitelPanelEvents(),
            onShow: new WebitelPanelEvents(),
            onMute: new WebitelPanelEvents(),
            onUnMute: new WebitelPanelEvents(),
            hide: function() {
                jQuery(".t-webitel-video").css('display', 'none');
                VideoControl.onHide.trigger();
            },
            show: function() {
                var $videoContainer = jQuery(".t-webitel-video");
                $videoContainer.css('display', 'block');
                $videoContainer.find('.t-video-controls-btn-mute').removeClass('t-video-controls-btn-mute__off').addClass('t-video-controls-btn-mute__on');
                VideoControl.onShow.trigger();
            },
            on: function() {
                VideoControl.currentStatus = VideoControlStatus.On;
            },
            off: function() {
                VideoControl.currentStatus = VideoControlStatus.Off;
            },
            status: function() {
                return VideoControl.currentStatus;
            },
            mute: function () {
                VideoControl.onMute.trigger();
            },
            unMute: function () {
                VideoControl.onUnMute.trigger();
            }
        };
        // VideoControl

        var initializePanelView = function ($) {
            var panel = $('<div>', {
                id: CONTAINER_NAME,
                class: 'webitel-def-comp',
                'ng-controller': 'WebitelCtiCtr'
            }); // create panel container
            var menuPanelContainer = $('<div>', {
                class: 'webitel-def-comp webitel-call ' + (configuration['style'] || '') + ' clr'
            }); //create panel container
            menuPanelContainer.append($('<div>', {
                class: 't-menu-overlay webitel-def-comp'
            })); // menu overlay
            menuPanelContainer.append($('<div>', {
                class: 'webitel-def-comp t-hide-menu-btn t-hide-menu-btn__hidden',
                id: 'webitel-menuPanelContainer'
            })); //button for expand/colapse menu

            var menuList = $('<ul>', {
                class: 'webitel-def-comp t-menu clr webitel-def-ul'
            }); //create menu container

            // Appending window with status-break form
            $('body').append(changeStatusMenu($));
            // IGOR
            $('body').append(changeContactMenu($));

            $('body').append(userSettingsMenu($));

            /* adding the items to the panel */
            menuList.append(initializeMenuBookList($));
            //menuList.append(initializeMenuConference($));
            //menuList.append(initializeMenuFavourites($));
            //menuList.append(initializeMenuMail($));
            menuList.append(initializeMenuRecent($));
            menuList.append(initializeMenuAlerts($));
            menuList.append(initializeMenuCalls($));
            menuList.append(initializeMenuNumber($));
            menuList.append(initializeMenuStatus($));

            menuPanelContainer.append(menuList);
            panel.append(menuPanelContainer);
            panel.append(mediaTags($));

            $('body').append(panel);
        };

        var mediaTags = function ($) {
            var mediaContainer = $('<div>', {
                    class: 't-webitel-video'
                }).css('display', 'none'),
                videoControlPanel = $('<tr>', {
                    class: 't-video-controls t-video-controls-full__off'
                }),
                incomingVideoTag = $('<div>', {
                    id: 'IncomingVideo-div'
                }),//.css('display', 'none'),
                outgoingVideoTag = $('<video>', {
                    id: 'OutgoingVideo',
                    class: 'OutgoingVideo-full__off'
                });//.css('display', 'none');
            mediaContainer
                .append(incomingVideoTag)
                .append(videoControlPanel
                    .append($('<th>', {
                        class: 't-video-controls-btn-full'
                    }))
                    .append($('<th>', {
                        class: 't-video-controls-btn-mute'
                    }))
                )
//                    .append($('<div>').append(outgoingVideoTag))
            return mediaContainer;
        }

        // Filling in the menuBookList with Html
        var initializeMenuBookList = function ($) {
            // Initialize menuBookList area
            var menuBookList = $('<li>', {class: 't-book t-longer_menu_item'}),
                menuBookListIcon = $('<div>', {class: 't-menu_item'});

            /*-----------------Fill in the menuBookListSubMenuContent--------------*/
            var subMenuContent = $('<div>', {class: 't-content'});

            // SubMenu SearchBlock on top position in the menuBookListSubMenuContent
            var subMenuSearchItem = searchBlock($);

            // SubMenu Book List Table
            var subMenuBookListTableContainer = $('<div>', {
                class: 'pane h288'
            });
            var subMenuBookListTable = $('<table>'),
                subMenuBookListTableRowData = [
                    {class: 't-status'},
                    {class: 't-box-btn-favor', innerHtml: {tag: '<div>', attrs: {class: 't-btn-favor'}}},
                    {class: 't-userpic', innerHtml: {tag: '<img>', attrs: {width: '31px', height: '31px', innerValue: 'userpic'}}},
                    {class: 't-username', innerValue: 'username', innerHtml: {}},
                    {class: 't-usernum', innerValue: 'number', innerHtml: {}},
                    {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {class: 't-btn t-btn__call', href: '#'}}},
                    {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {class: 't-btn t-btn__call-2', href: '#'}}}
                ];

            // Fill in the table with table rows which equals to the BOOK_LIST array length
            // We iterate through BOOK_LIST
            // On every event separate tr is created
            for (var key in BOOK_LIST) {
                var tableRowContent = $('<tr>');
                // Here we iterate through the row data to know how many td is needed
                for (var i in subMenuBookListTableRowData) {
                    var innerHtml = subMenuBookListTableRowData[i].innerHtml,
                        innerValue = subMenuBookListTableRowData[i].innerValue;

                    // Here we create inner html structure if neccessary
                    if(innerHtml || innerValue){

                        // if we need to fill in data dynamically from the server to the innerHtml
                        if(innerHtml.attrs && innerHtml.attrs.innerValue){
                            var innerHtmlValue = innerHtml.attrs.innerValue;

                            for (var property in BOOK_LIST[key][innerHtmlValue]){
                                innerHtml.attrs[property] = BOOK_LIST[key][innerHtmlValue][property]
                            };
                        };

                        // Filling the table row with data
                        tableRowContent
                            .append($('<td>', {
                                    class: subMenuBookListTableRowData[i].class,
                                    text: BOOK_LIST[key][innerValue]
                                })
                                    .append($(innerHtml.tag, innerHtml.attrs))
                            )
                        // Removing helper innerValue from the DOM elements
                        if(tableRowContent.find('[innerValue]')[0]){
                            tableRowContent.find('[innerValue]')[0].removeAttribute('innerValue')
                        };
                    } else {
                        // Filling the table row with data if there is no innerHtml structure
                        tableRowContent.append(
                            $('<td>', {class: subMenuBookListTableRowData[i].class})
                        )
                    };
                };
                // append TableRow to the table
                subMenuBookListTable.append(tableRowContent.toggleClass(BOOK_LIST[key].class))
                subMenuBookListTableContainer.append(subMenuBookListTable)
            };

            /*-----------------END of the menuBookListSubMenuContent--------------*/
            var t = subMenuBookListTable = $('<table>');
            subMenuBookListTableContainer.append(t);
            subMenuContent.append(subMenuSearchItem);
            subMenuContent.append(subMenuBookListTableContainer);

            menuBookList.append(menuBookListIcon);
            menuBookList.append(subMenuContent);

            return menuBookList;
        };

        // Filling in the menuConference with Html
        var initializeMenuConference = function ($) {
            // Initilize menuConference area
            var menuConference = $('<li>', {class: 't-conf t-longer_menu_item'}),
                menuConferenceIcon = $('<div>', {class: 't-menu_item'});

            /*-----------------Fill in the menuConferenceSubMenuContent---------------*/
            var subMenuContent = $('<div>', {class: 't-content'});

            // SubmMenu SearchBlock on top position in the menuConferenceSubMenuContent
            var subMenuSearchItem = searchBlock($, 'addUserBlock');

            // SubMenu Conference Table
            var subMenuConferenceTable = $('<table>'),
                subMenuConferenceTableRowData = [
                    {class: 't-box-conf-icon', innerHtml: {tag: '<div>', attrs: {class: 't-conf-icon'}}},
                    {class: 't-username', innerValue: 'username', innerHtml: {}},
                    {class: 't-pin-box'},
                    {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {href: '#', innerValue: 'action'}}},
                    {class: 't-time', innerValue: 'time', innerHtml: {}},
                    {class: 't-date', innerValue: 'date', innerHtml: {}}
                ];

            // Fill in the table with table rows which equals to the CONFERENCE_EVENTS array length
            // We iterate through CONFERENCE_EVENTS
            // On every event separate tr is created
            for (var key in CONFERENCE_EVENTS) {
                var tableRowContent = $('<tr>');
                // Here we iterate through the row data to know how many td is needed
                for (var i in subMenuConferenceTableRowData) {
                    var innerHtml = subMenuConferenceTableRowData[i].innerHtml,
                        innerValue = subMenuConferenceTableRowData[i].innerValue;

                    // Here we create inner html structure if neccessary
                    if(innerHtml || innerValue){

                        // if we need to fill in data dynamically from the server to the innerHtml
                        if(innerHtml.attrs && innerHtml.attrs.innerValue){
                            var innerHtmlValue = innerHtml.attrs.innerValue;

                            for (var property in CONFERENCE_EVENTS[key][innerHtmlValue]){
                                innerHtml.attrs[property] = CONFERENCE_EVENTS[key][innerHtmlValue][property]
                            };
                        };

                        // Filling the table row with data
                        tableRowContent
                            .append($('<td>', {
                                    class: subMenuConferenceTableRowData[i].class,
                                    text: CONFERENCE_EVENTS[key][innerValue]
                                })
                                    .append($(innerHtml.tag, innerHtml.attrs))
                            )
                        // Removing helper innerValue from the DOM elements
                        if(tableRowContent.find('[innerValue]')[0]){
                            tableRowContent.find('[innerValue]')[0].removeAttribute('innerValue')
                        };
                    } else {
                        // Filling the table row with data if there is no innerHtml structure
                        tableRowContent.append(
                            $('<td>', {class: subMenuConferenceTableRowData[i].class})
                        )
                    };
                };
                // append TableRow to the table
                subMenuConferenceTable.append(tableRowContent.toggleClass(CONFERENCE_EVENTS[key].class))
            };

            /*-----------------END of the menuConferenceSubMenuContent---------------*/

            subMenuContent.append(subMenuSearchItem);
            subMenuContent.append(subMenuConferenceTable);

            menuConference.append(menuConferenceIcon);
            menuConference.append(subMenuContent);

            return menuConference;
        };

        // Filling in menuFavourites with Html
        var initializeMenuFavourites = function ($) {
            // Initializing menuFavourites area
            var menuFavourites = $('<li>', {class: 't-favor t-longer_menu_item'}),
                menuFavouritesIcon = $('<div>', {class: 't-menu_item'});

            /*----------------Fill in the menuFavouritesSubMenuContent--------------*/
            var subMenuContent = $('<div>', {class: 't-content'});

            // SubMenu SearchBlock on top position in the menuFavouritesSubMenuContent
            var subMenuSearchItem = searchBlock($);

            // Submenu Favourites Table
            var subMenuFavouritesTable = $('<table>'),
                subMenuFavouritesTableRowData = [
                    {class: 't-status'},
                    {class: 't-box-btn-favor', innerHtml: {tag: '<div>', attrs: {class: 't-btn-favor'}}},
                    {class: 't-userpic', innerHtml: {tag: '<img>', attrs: {width: '31px', height: '31px', innerValue: 'userpic'}}},
                    {class: 't-username', innerValue: 'username', innerHtml: {}},
                    {class: 't-usernum', innerValue: 'number', innerHtml: {}},
                    {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {class: 't-btn t-btn__call', href: '#'}}}
                ];

            // Fill in the table with table rows which equals to the FAVOURITES array length
            // We iterate through FAVOURITES
            // On every event separate tr is created
            for (var key in FAVOURITES) {
                var tableRowContent = $('<tr>');
                // Here we iterate through the row data to know how many td is needed
                for (var i in subMenuFavouritesTableRowData) {
                    var innerHtml = subMenuFavouritesTableRowData[i].innerHtml,
                        innerValue = subMenuFavouritesTableRowData[i].innerValue;

                    // Here we create inner html structure if neccessary
                    if(innerHtml || innerValue){

                        // if we need to fill in data dynamically from the server to the innerHtml
                        if(innerHtml.attrs && innerHtml.attrs.innerValue){
                            var innerHtmlValue = innerHtml.attrs.innerValue;

                            for (var property in FAVOURITES[key][innerHtmlValue]){
                                innerHtml.attrs[property] = FAVOURITES[key][innerHtmlValue][property]
                            };
                        };

                        // Filling the table row with data
                        tableRowContent
                            .append($('<td>', {
                                    class: subMenuFavouritesTableRowData[i].class,
                                    text: FAVOURITES[key][innerValue]
                                })
                                    .append($(innerHtml.tag, innerHtml.attrs))
                            )
                        // Removing helper innerValue from the DOM elements
                        if(tableRowContent.find('[innerValue]')[0]){
                            tableRowContent.find('[innerValue]')[0].removeAttribute('innerValue')
                        };
                    } else {
                        // Filling the table row with data if there is no innerHtml structure
                        tableRowContent.append(
                            $('<td>', {class: subMenuFavouritesTableRowData[i].class})
                        )
                    };
                };
                // append TableRow to the table
                subMenuFavouritesTable.append(tableRowContent.toggleClass(FAVOURITES[key].class))
            };

            /*----------------End of the menuFavouritesSubMenuContent--------------*/

            subMenuContent.append(subMenuSearchItem);
            subMenuContent.append(subMenuFavouritesTable);

            menuFavourites.append(menuFavouritesIcon);
            menuFavourites.append(subMenuContent);
            return menuFavourites;
        };

        // Filling menuMail with Html
        var initializeMenuMail = function ($) {
            // Initializing menuMail area
            var menuMail = $('<li>', {class: 't-mail t-longer_menu_item'}),
                menuMailIcon = $('<div>', {class: 't-menu_item'});

            /*----------------Fill in the menuMailSubMenuContent--------------*/
            var subMenuContent = $('<div>', {class: 't-content'});

            // SubMenu SearchBlock on top of the subMenuContent
            var subMenuSearchItem = searchBlock($);

            // Submenu Mail Table
            var subMenuMailEventsTable = $('<table>'),
                subMenuMailEventsTableRowData = [
                    {class: 't-status'},
                    {class: 't-time', innerValue: 'time', innerHtml: {}},
                    {class: 't-date', innerValue: 'date', innerHtml: {}},
                    {class: 't-usernum', innerValue: 'number', innerHtml: {}},
                    {class: 't-userpic', innerHtml: {tag: '<img>', attrs: {width: '31px', height: '31px', innerValue: 'userpic'}}},
                    {class: 't-username', innerValue: 'username', innerHtml: {}},
                    {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {class: 't-btn t-btn__call', href: '#'}}},
                    {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {class: 't-btn t-btn__voice', href: '#'}}},
                    {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {class: 't-btn t-btn__down', href: '#'}}},
                    {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {class: 't-btn t-btn__trash', href: '#'}}}
                ];

            // Fill in the table with table rows which equals to the MAIL_EVENTS array length
            // We iterate through MAIL_EVENTS
            // On every event separate tr is created
            for (var key in MAIL_EVENTS) {
                var tableRowContent = $('<tr>');
                // Here we iterate through the row data to know how many td is needed
                for (var i in subMenuMailEventsTableRowData) {
                    var innerHtml = subMenuMailEventsTableRowData[i].innerHtml,
                        innerValue = subMenuMailEventsTableRowData[i].innerValue;

                    // Here we create inner html structure if neccessary
                    if(innerHtml || innerValue){

                        // if we need to fill in data dynamically from the server to the innerHtml
                        if(innerHtml.attrs && innerHtml.attrs.innerValue){
                            var innerHtmlValue = innerHtml.attrs.innerValue;

                            for (var property in MAIL_EVENTS[key][innerHtmlValue]){
                                innerHtml.attrs[property] = MAIL_EVENTS[key][innerHtmlValue][property]
                            };
                        };

                        // Filling the table row with data
                        tableRowContent
                            .append($('<td>', {
                                    class: subMenuMailEventsTableRowData[i].class,
                                    text: MAIL_EVENTS[key][innerValue]
                                })
                                    .append($(innerHtml.tag, innerHtml.attrs))
                            )
                        // Removing helper innerValue from the DOM elements
                        if(tableRowContent.find('[innerValue]')[0]){
                            tableRowContent.find('[innerValue]')[0].removeAttribute('innerValue')
                        };
                    } else {
                        // Filling the table row with data if there is no innerHtml structure
                        tableRowContent.append(
                            $('<td>', {class: subMenuMailEventsTableRowData[i].class})
                        )
                    };
                };
                // append TableRow to the table
                subMenuMailEventsTable.append(tableRowContent.toggleClass(MAIL_EVENTS[key].class))

                // If the user has mailMessages than we add them to the current list
                // if the mailEvent has voiceMessage then build a voiceMessageControlPanel
                if(MAIL_EVENTS[key].voiceMessage){
                    var voiceMessage = $('<tr>', {class: 't-mail-sound-box-tr t-status__05'}),
                        voiceMessageSenderStatus = $('<td>', {class: 't-status'}),
                        voiceMessageControlPanel = $('<td>', {colspan: '9'}),
                        voiceMessageControlPanelContainer = $('<div>', {class: 't-mail-sound'});

                    // Fill in the Progress Line
                    var soundProgressBar = $('<div>', {class: 't-sound-progress-box'}),
                        currentProgress = $('<div>', {class: 't-sound-progress'});
                    soundProgressBar.append(currentProgress);

                    // Fill in the TimeLine
                    var time = $('<span>', {class: 't-time', text: '00:00'});

                    // Fill in SoundController
                    var soundController = $('<div>', {class: 't-mail-sound_panel'}),
                        soundControllerPlay = $('<a>', {class: 't-mail-sound_play'}),
                        soundControllerStop = $('<a>', {class: 't-mail-sound_stop'}),
                        soundControllerTime = $('<span>', {class: 't-time', text: '02:31'});

                    soundController
                        .append(soundControllerPlay)
                        .append(soundControllerStop)
                        .append(soundControllerTime);

                    // Put together voiceMessageControlPanelContainer
                    voiceMessageControlPanelContainer.append(soundProgressBar);
                    voiceMessageControlPanelContainer.append(time);
                    voiceMessageControlPanelContainer.append(soundController);

                    // Put together of the table
                    voiceMessageControlPanel.append(voiceMessageControlPanelContainer);
                    voiceMessage.append(voiceMessageSenderStatus);
                    voiceMessage.append(voiceMessageControlPanel);
                    subMenuMailEventsTable.append(voiceMessage);
                };
            };

            // Appending menuIcon and table data to the subMenuContent
            subMenuContent.append(subMenuSearchItem);
            subMenuContent.append(subMenuMailEventsTable);
            /*----------------End of menuMailSubMenuContent--------------*/

            // Fill in the menuMail with Icon
            menuMail
                .append(menuMailIcon)
                .append(subMenuContent);

            return menuMail;
        };

        // Filling MenuRecent with Html
        var initializeMenuRecent = function ($) {
            var menuRecent = $('<li>', {class: 't-recent t-longer_menu_item'}),
                menuIcon = $('<div>', {class: 't-menu_item'});

            /*--------------- Fill in the SubMenuContent --------------*/
            var subMenuContent = $('<div>', {class: 't-content'});

            // Submenu SearchBlock on top of the subMenuRecentEvents
            var subMenuSearchItem = searchBlock($);

            // SubMenu Book List Table
            var subMenuBookListTableContainer = $('<div>', {
                class: 'pane h288'
            });

            // Submenu Events Table
            var subMenuEventsTable = $('<table>'),
                subMenuEventsTableRowData = [
                    {class: 't-status'},
                    {class: 't-box-recent-arrow-icon', innerHtml: {tag: '<div>', attrs: {class: 't-recent-arrow-icon'}}},
                    {class: 't-time', innerValue: 'time', innerHtml: {}},
                    {class: 't-usernum', innerValue: 'number', innerHtml: {}},
                    // {class: 't-userpic', innerHtml: {tag: '<img>', attrs: {width: '31px', height: '31px', innerValue: 'userpic'}}},
                    {class: 't-username', innerValue: 'username', innerHtml: {}},
                    {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {href: '#', class: 't-btn t-btn__call'}}}
                ];

            // Fill in the table with table rows which equals to the RECENT_EVENTS array length
            // We iterate through RECENT_EVENTS
            // On every event separate tr is created
            for (var key in RECENT_EVENTS) {
                var tableRowContent = $('<tr>');
                // Here we iterate through the row data to know how many td is needed
                for (var i in subMenuEventsTableRowData) {
                    var innerHtml = subMenuEventsTableRowData[i].innerHtml,
                        innerValue = subMenuEventsTableRowData[i].innerValue;

                    // Here we create inner html structure if neccessary
                    if(innerHtml || innerValue){

                        // if we need to fill in data dynamically from the server to the innerHtml
                        if(innerHtml.attrs && innerHtml.attrs.innerValue){
                            var innerHtmlValue = innerHtml.attrs.innerValue;

                            for (var property in RECENT_EVENTS[key][innerHtmlValue]){
                                innerHtml.attrs[property] = RECENT_EVENTS[key][innerHtmlValue][property]
                                delete innerHtml.attrs['innerHtml']
                            };
                        };

                        // Filling the table row with data
                        tableRowContent
                            .append($('<td>', {
                                    class: subMenuEventsTableRowData[i].class,
                                    text: RECENT_EVENTS[key][innerValue]
                                })
                                    .append($(innerHtml.tag, innerHtml.attrs))
                            )
                        // Removing helper innerValue from the DOM elements
                        if(tableRowContent.find('[innerValue]')[0]){
                            tableRowContent.find('[innerValue]')[0].removeAttribute('innerValue')
                        };
                    } else {
                        // Filling the table row with data if there is no innerHtml structure
                        tableRowContent.append(
                            $('<td>', {class: subMenuEventsTableRowData[i].class})
                        )
                    };
                };
                // append TableRow to the table
                subMenuEventsTable.append(tableRowContent.toggleClass(RECENT_EVENTS[key].class));
                subMenuBookListTableContainer.append(subMenuEventsTable);
            };
            var t = subMenuEventsTable = $('<table>');
            subMenuBookListTableContainer.append(t);

            // Appending all parts to the subMenu
            subMenuContent.append(subMenuSearchItem);
            subMenuContent.append(subMenuBookListTableContainer);
            /*--------------SubMenuContent End-------------------------*/

            // Icon to the menu
            menuIcon.append($('<span>', {
                class: 't-menu_messages-am',
                text: RECENT_EVENTS.length
            }).css('display', 'none'));

            // Collecting everithing together
            menuRecent
                .append(menuIcon)
                .append(subMenuContent)

            return menuRecent;
        };

        // IGOR
        function addMenuRecent($, key) {
            delete RECENT_EVENTS[key]['identifyCollection'];
            var menuRecent = $('.t-recent').find('table');
            // Submenu Events Table
            var subMenuEventsTableRowData = [
                // {class: 't-status'},
                {class: 't-box-recent-arrow-icon', innerHtml: {tag: '<div>', attrs: {class: 't-recent-arrow-icon'}}},
                {class: 't-time', innerValue: 'time', innerHtml: {}},
                {class: 't-usernum', innerValue: 'number', innerHtml: {}},
                //{class: 't-userpic', innerHtml: {tag: '<img>', attrs: {width: '31px', height: '31px', innerValue: 'userpic'}}},
                {class: 't-username', innerValue: 'username', innerHtml: {}},
                {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {class: 't-btn t-btn__call',
                    click: function () {
                        var $this = $(this),
                            $parent = $this.parent(),
                            dialedNumber = $parent.parent().find('.t-usernum').text();
                        if(dialedNumber){
                            OnNewCall.trigger(dialedNumber);
                        };
                    }
                }}}
            ];

            // Fill in the table with table rows which equals to the RECENT_EVENTS array length
            // We iterate through RECENT_EVENTS
            // On every event separate tr is created

            var tableRowContent = $('<tr>');
            // Here we iterate through the row data to know how many td is needed
            for (var i in subMenuEventsTableRowData) {
                var innerHtml = subMenuEventsTableRowData[i].innerHtml,
                    innerValue = subMenuEventsTableRowData[i].innerValue;

                // Here we create inner html structure if neccessary
                if(innerHtml || innerValue){

                    // if we need to fill in data dynamically from the server to the innerHtml
                    if(innerHtml.attrs && innerHtml.attrs.innerValue){
                        var innerHtmlValue = innerHtml.attrs.innerValue;

                        for (var property in RECENT_EVENTS[key][innerHtmlValue]){
                            innerHtml.attrs[property] = RECENT_EVENTS[key][innerHtmlValue][property]
                            delete innerHtml.attrs['innerHtml']
                        };
                    };

                    // Filling the table row with data
                    tableRowContent
                        .append($('<td>', {
                                class: subMenuEventsTableRowData[i].class,
                                text: RECENT_EVENTS[key][innerValue]
                            })
                                .append($(innerHtml.tag, innerHtml.attrs))
                        )
                    // Removing helper innerValue from the DOM elements
                    if(tableRowContent.find('[innerValue]')[0]){
                        tableRowContent.find('[innerValue]')[0].removeAttribute('innerValue')
                    };
                } else {
                    // Filling the table row with data if there is no innerHtml structure
                    tableRowContent.append(
                        $('<td>', {class: subMenuEventsTableRowData[i].class})
                    )
                };
            };
            // append TableRow to the table
            menuRecent.append(tableRowContent.toggleClass(RECENT_EVENTS[key].class));

            $('.t-recent').find('span').css('display', 'inline-block').text(RECENT_EVENTS.length);
            return menuRecent;
        };
        // ENDIGOR

        // Filling MenuAlerts with the HTML structure
        var initializeMenuAlerts = function ($) {
            var menuAlert = $('<li>', {class: 't-alert'}), // the li in the menu list
                menuAlertIcon = $('<div>', {class: 't-menu_item'}); // Picture of the alert menu

            /*--------------- Fill in the SubMenuContent --------------*/
            var subMenuContent = $('<div>', {class: 't-content'});

            // Append all the table info into subMenuContent of the menu alerts
            subMenuContent.append(menuAlertCallInfoArea($));
            /*----------------END of the subMenuContent--------------*/

            // Fill in the alert section of the menu
            menuAlert
                .append(menuAlertIcon)
                .append(subMenuContent)

            // webitelPanelCallEvents($);
            return menuAlert;
        };

        // Drawing the table for menu alerts
        var menuAlertCallInfoArea = function ($) {
            // Submenu Events Table
            var subMenuAlertsTable = $('<table>'),
                subMenuAlertsTableRowData = [
                    {class: 't-status'},
                    {class: 't-box-recent-arrow-icon', innerHtml: {tag: '<div>', attrs: {class: 't-recent-arrow-icon'}}},
                    {class: 't-time'},
                    {class: 't-usernum', innerValue: 'number', innerHtml: {}},
                    // {class: 't-userpic', innerHtml: {tag: '<img>', attrs: {width: '31px', height: '31px', innerValue: 'userpic'}}},
                    {class: 't-username', innerValue: 'username', innerHtml: {}},
                    {class: 't-box-btn t-alert-box__first', innerHtml: {tag: '<a>', attrs: {href: '#'}}},
                    {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {href: '#', class: 't-btn t-btn__call-2'}}},
                    {class: 't-box-btn t-alert-box__last', innerHtml: {tag: '<a>', attrs: {href: '#', class: 't-btn t-btn__end'}}}
                    // {class: 't-btn__x-box', innerHtml: {tag: '<a>', attrs: {href: '#', class: 't-btn t-btn__x'}}}
                ];

            // Fill in the table with table rows which equals to the AlertMenuObjectsArray array length
            // We iterate through AlertMenuObjectsArray
            // On every event separate tr is created
            for (var key in AlertMenuObjectsArray) {
                var tableRowContent = $('<tr>', {
                    'data-call-status': AlertMenuObjectsArray[key].callStatus
                });
                // Here we iterate through the row data to know how many td is needed
                for (var i in subMenuAlertsTableRowData) {
                    var innerHtml = subMenuAlertsTableRowData[i].innerHtml,
                        innerValue = subMenuAlertsTableRowData[i].innerValue;
                    // Here we create inner html structure if neccessary
                    if(innerHtml || innerValue){

                        // if we need to fill in data dynamically from the server to the innerHtml
                        if(innerHtml.attrs && innerHtml.attrs.innerValue){
                            var innerHtmlValue = innerHtml.attrs.innerValue;

                            for (var property in AlertMenuObjectsArray[key][innerHtmlValue]){
                                innerHtml.attrs[property] = AlertMenuObjectsArray[key][innerHtmlValue][property]
                            };
                        };
                        // Filling the table row with data
                        tableRowContent
                            .append($('<td>', {
                                    class: subMenuAlertsTableRowData[i].class,
                                    text: AlertMenuObjectsArray[key][innerValue]
                                })
                                    .append($(innerHtml.tag, innerHtml.attrs))
                            )
                        // Removing helper innerValue from the DOM elements
                        if(tableRowContent.find('[innerValue]')[0]){
                            tableRowContent.find('[innerValue]')[0].removeAttribute('innerValue')
                        };

                    } else {
                        // Filling the table row with data if there is no innerHtml structure
                        tableRowContent.append(
                            $('<td>', {
                                class: subMenuAlertsTableRowData[i].class,
                                text: subMenuAlertsTableRowData[i].text
                            })
                        )
                        // Setting up TimerArea and Starting Timer
                        if(tableRowContent.find('td:last').attr('class') == 't-time'){
                            //                          var timer = AlertMenuObjectsArray[key].timer;
                            var timeArea = tableRowContent.find('td:last'),
                                hours_span = $('<span>', {class: 'hours', text: '00'}),
                                minutes_span = $('<span>', {class: 'minutes', text: '00'}),
                                seconds_span = $('<span>', {class: 'seconds', text: '00'});

                            var timer = new CallTimer(timeArea);
                            AlertMenuObjectsArray[key]['timer'] = timer;


                            timeArea
                                .append(hours_span)
                                .append(minutes_span)
                                .append(seconds_span)

                            timer.start();
                        };
                    };
                };
                // Appending a class action which depends on incoming call or outcoming call
                if(IS_WEBRTC) {
                    tableRowContent.find('.t-alert-box__first a').addClass(AlertMenuObjectsArray[key].callDirectionClass)
                };

                // append TableRow to the table
                tableRowContent.attr('id', AlertMenuObjectsArray[key].id);
                subMenuAlertsTable.append(tableRowContent.toggleClass(AlertMenuObjectsArray[key].class))
            };

            return subMenuAlertsTable
        };

        // IGOR
        // Drawing the table for menu alerts
        var addMenuAlertCallInfoArea = function ($, key) {
            // Submenu Events Table
            var subMenuAlertsTable = $('.t-alert').find('table'),
                subMenuAlertsTableRowData = [
                    {class: 't-status'},
                    {class: 't-box-recent-arrow-icon', innerHtml: {tag: '<div>', attrs: {class: 't-recent-arrow-icon'}}},
                    {class: 't-time'},
                    {class: 't-usernum', innerValue: 'number', innerHtml: {}},
                    //{class: 't-userpic', innerHtml: {tag: '<img>', attrs: {width: '31px', height: '31px', innerValue: 'userpic'}}},
                    {class: 't-username', innerValue: 'username', innerHtml: {}},
                    {class: 't-box-btn t-alert-box__first', innerHtml: {tag: '<a>', attrs: {href: '#'}}},
                    {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {href: '#', class: 't-btn t-btn__call-2'}}},
                    {class: 't-box-btn t-alert-box__last', innerHtml: {tag: '<a>', attrs: {href: '#', class: 't-btn t-btn__end'}}}
                    //  {class: 't-btn__x-box', innerHtml: {tag: '<a>', attrs: {href: '#', class: 't-btn t-btn__x'}}}
                ];

            // Fill in the table with table rows which equals to the AlertMenuObjectsArray array length
            // We iterate through AlertMenuObjectsArray
            // On every event separate tr is created
            //        for (var key in AlertMenuObjectsArray) {
            var tableRowContent = $('<tr>', {
                'data-call-status': AlertMenuObjectsArray[key].callStatus
            });
            // Here we iterate through the row data to know how many td is needed
            for (var i in subMenuAlertsTableRowData) {
                var innerHtml = subMenuAlertsTableRowData[i].innerHtml,
                    innerValue = subMenuAlertsTableRowData[i].innerValue;
                // Here we create inner html structure if neccessary
                if(innerHtml || innerValue){

                    // if we need to fill in data dynamically from the server to the innerHtml
                    if(innerHtml.attrs && innerHtml.attrs.innerValue){
                        var innerHtmlValue = innerHtml.attrs.innerValue;

                        for (var property in AlertMenuObjectsArray[key][innerHtmlValue]){
                            innerHtml.attrs[property] = AlertMenuObjectsArray[key][innerHtmlValue][property]
                        };
                    };
                    // Filling the table row with data
                    tableRowContent
                        .append($('<td>', {
                                class: subMenuAlertsTableRowData[i].class,
                                text: AlertMenuObjectsArray[key][innerValue]
                            })
                                .append($(innerHtml.tag, innerHtml.attrs))
                        )
                    // Removing helper innerValue from the DOM elements
                    if(tableRowContent.find('[innerValue]')[0]){
                        tableRowContent.find('[innerValue]')[0].removeAttribute('innerValue')
                    };

                } else {
                    // Filling the table row with data if there is no innerHtml structure
                    tableRowContent.append(
                        $('<td>', {
                            class: subMenuAlertsTableRowData[i].class,
                            text: subMenuAlertsTableRowData[i].text
                        })
                    )
                    // Setting up TimerArea and Starting Timer
                    if(tableRowContent.find('td:last').attr('class') == 't-time'){
                        //  var timer = AlertMenuObjectsArray[key].timer;
                        var timeArea = tableRowContent.find('td:last'),
                            hours_span = $('<span>', {class: 'hours', text: '00'}),
                            minutes_span = $('<span>', {class: 'minutes', text: '00'}),
                            seconds_span = $('<span>', {class: 'seconds', text: '00'});

                        var timer = new CallTimer(timeArea, key);
                        AlertMenuObjectsArray[key]['timer'] = timer;
                        timeArea
                            .append(hours_span)
                            .append(minutes_span)
                            .append(seconds_span)

                        timer.start();
                    };
                };
            };
            // Appending a class action which depends on incoming call or outcoming call
            if(IS_WEBRTC) {
                tableRowContent.find('.t-alert-box__first a').addClass(AlertMenuObjectsArray[key].callDirectionClass)
            };

            // append TableRow to the table
            tableRowContent.attr('id', AlertMenuObjectsArray[key].id);
            subMenuAlertsTable.append(tableRowContent.toggleClass(AlertMenuObjectsArray[key].class))
            //    };

            return subMenuAlertsTable
        };
        //

        // Timer to count call time
        var CallTimer = function (timeArea, callKey) {
            var totalSeconds = 0;
            var timerId = 0;
            var that = this;
            this.interval = 1000;
            this.enable = false;
            // Function to strat the timer
            this.start = function () {
                that.enabled = true;
                if(that.enabled) {
                    that.timerId = setInterval(that.tick, that.interval);
                };
            };
            // Function: Stops the timer
            this.stop = function () {
                that.enabled = false;
                try {
                    var id = timeArea.parent().attr('id');
                    for (var key in AlertMenuObjectsArray) {
                        if (AlertMenuObjectsArray[key].id == id) {
                            var hours = timeArea.find(".hours").text(),
                                minutes = timeArea.find(".minutes").text(),
                                seconds = timeArea.find(".seconds").text();
                            AlertMenuObjectsArray[key].time = hours + ' : ' + minutes + ' : ' + seconds;
                            break;
                        }
                    }
                } catch (e) {}
                clearInterval(that.timerId);
            };


            // Event Timer Tick
            this.tick = function () {
                var hours = timeArea.find(".hours"),
                    minutes = timeArea.find(".minutes"),
                    seconds = timeArea.find(".seconds");

                var setTime = function () {
                    ++totalSeconds;

                    seconds.html(pad(totalSeconds%60));
                    minutes.html(pad(parseInt(totalSeconds/60)));
                    hours.html(pad(parseInt(totalSeconds/60/60)));
                };

                var pad = function (val) {
                    var valString = val + "";
                    if(valString.length < 2) {
                        return "0" + valString;
                    } else {
                        return valString;
                    };
                };
                setTime();
            };
        };

        // Filling MenuCalls with the HTML structure
        var initializeMenuCalls = function ($) {

            var menuCalls = $('<li>', {
                    class: 't-calls t-longer_menu_item'
                }), //is the item in the t-menu unordered list
                menuCallsContent = $('<div>', {
                    class: 't-content webitel-del-li',
                    style: "display: none;"
                }).append($('<div>', {
                    id: 'search_advice_wrapper',
                    click: function(a){
                        if (!a.target.id) return;
                        var dialedNumber = a.target.id.replace('advice_variant_value:', '');
                        if (CALLFORWARDING.uuid && dialedNumber) {
                            OnTransferCall.trigger({
                                uuid: CALLFORWARDING.uuid,
                                number: dialedNumber
                            });
                            return;
                        }
                        if(dialedNumber){
                            $("#search_advice_wrapper").html("").show();
                            var $inp = $(this).parent().find('input');
                            $inp.val(dialedNumber);
                            $inp.focus();
                            //   OnNewCall.trigger(dialedNumber);
                        };
                    }
                })), // the content which is shown after the click event
                menuCallsContentForm = $('<div>', {
                    class: 't-phone webitel-def-comp'
                }); // is the container which has main fields in the poped up menu bar

            // Creating a phone digit panel
            var phoneDigits = [1,2,3,4,5,6,7,8,9,'*',0,'#'];
            var numberList = $('<ul>', {class: 't-phone_num webitel-def-ul'});
            for (var i in phoneDigits) {
                numberList.append($('<li>', {
                    text: phoneDigits[i],
                    class: 'webitel-del-li'
                }));
            };

            // Filling the menuCallsContent which appear after click
            menuCallsContentForm
                .append($('<div>', {
                    class: 't-phone_num-btn'
                }))
                .append($('<input>', {
                    type: 'text',
                    placeholder: (ENG_LNG)? 'Name / number' : 'Имя / номер',
                    autofocus: 'autofocus',
                    class: 'input-webitel',
                    keyup: function (I) {
                        switch(I.keyCode) {
                            // игнорируем нажатия на эти клавишы
                            case 13:  // enter
                                var $this = $(this),
                                    $parent = $this.parent(),
                                    dialedNumber = $parent.find('input').val();
                                if (CALLFORWARDING.uuid && dialedNumber) {
                                    CALLFORWARDING.number = dialedNumber;
                                    OnTransferCall.trigger(CALLFORWARDING);
                                    return
                                }
                                if(dialedNumber){
                                    OnNewCall.trigger(dialedNumber);
                                };
                                break;
                            case 27:  // escape
                            case 38:  // стрелка вверх
                            case 37:
                            case 39:
                            case 40:  // стрелка вниз
                                break;

                            default:
                                // Find
                                break;
                        }
                    }
                }))
                .append($('<div>', {
                        class: 't-phone_num_call-btn'
                    })
                );
            //.append($('<div>', {class: 't-phone_num_call-btn'}));

            menuCallsContent.append(menuCallsContentForm)
            menuCallsContent.append(numberList)
            menuCalls.append($('<div>', {
                class: 't-menu_item'
            }));
            menuCalls.append(menuCallsContent)
            return menuCalls;
        };

        // Filling MenuTelephoneNumber with HTML structure
        var initializeMenuNumber = function ($) {
            var menuCallNumber = $('<li>', {
                class: 't-num t-longer_menu_item'
            });

            menuCallNumber
                .append($('<div>', {
                    class: 't-menu_item',
                    dblclick: function() {
                        return;
                        $('#userSettings').modal({
                            overlayClose: true,
                            closeClass: 'modalClose',
                            onOpen: function(dialog) {
                                dialog.overlay.fadeIn('fast', function() {
                                    dialog.data.hide();
                                    dialog.data.find('#w-login').val(configuration['user'].split('@')[0]);
                                    dialog.data.find('#w-password').val(configuration['password']);
                                    dialog.container.fadeIn('fast', function() {
                                        dialog.data.fadeIn('fast');
                                    });
                                });
                            },
                            onClose: function(dialog) {
                                dialog.data.fadeOut('fast', function() {
                                    dialog.container.hide('fast', function() {
                                        dialog.overlay.fadeOut('fast', function() {
                                            $.modal.close();
                                        });
                                    });
                                });
                            }
                        });
                    }
                })
                    .append($('<span>', {
                        id: 'current-agent-phone-number',
                        text: NUMBER
                    })));

            menuCallNumber.append($('<div>', {
                class: 't-content',
                style: "display: none;"
            }));
            return menuCallNumber;
        };

        // Filling MenuStatusContainer with HTML structure
        var initializeMenuStatus = function ($) {
            var menuStatus = $('<li>', {
                class: 't-status-select t-active'
            });
            var menuStatusIcon = $('<div>', {
                class: 't-menu_item t-status__01 clr'
            });
            var subMenuContent = $('<div>', {
                class: 't-content'
            });
            var subMenuContentContainer = $('<div>', {
                class: 't-status-select-menu'
            }); // container for menu items

            var actionSectionObject = $('<ul>');
            for (var key in ACTION_SECTION) {
                actionSectionObject.append($('<li>', {
                    class: ACTION_SECTION[key].class,
                    text: ACTION_SECTION[key].text
                }));
            };

            var statusSectionObject = $('<ul>');
            for (var key in STATUS_SECTION) {
                statusSectionObject.append($('<li>', {
                    class: STATUS_SECTION[key].class,
                    id: STATUS_SECTION[key].id,
                    text: STATUS_SECTION[key].text
                })
                    .append($('<div>', {
                        class: 't-status'
                    })));
            };

            menuStatusIcon
                .append($('<div>', {
                    class: 't-status'
                }))
                .append($('<div>', {
                    class: 't-userpic'
                })
                    .append($('<img>', {
                        //src: "img/temp/photo-1.jpg",
                        id: 'webitel-current-user-img',
                        width: "31",
                        height: "31"
                    })))
                .append($('<span>', {
                    class: 't-status-select_text',
                    id: 'status',
                    text: DEFAULT_STATUS
                }));

            // Adding actions and statuses to the menu container
            subMenuContentContainer.append(actionSectionObject).append(statusSectionObject);
            // Adding menu container to the subMenuContent which pops up on click
            subMenuContent.append(subMenuContentContainer);

            menuStatus.append(menuStatusIcon);
            menuStatus.append(subMenuContent);

            return menuStatus;
        };

        // Helper to construct the search box for subMenus
        var searchBlock = function ($, addUserBlock) {
            var subMenuSearchItem = $('<div>', {class: 't-window_head t-window_head__search t-window_head__favor'}),
                subMenuSearchItemSearchIcon = $('<div>', {class: 't-btn-search'}),
                subMenuSearchItemSearchInput = $('<input>', {
                        type: 'text',
                        placeholder: (ENG_LNG)? 'Name / number' : 'Имя / номер',
                        class: 'input-webitel',
                        keyup: function() {
                            // IGOR
                            var searchValue = $(this).val();
                            var data = $(this).parent().parent().find('tr');
                            if (searchValue == '') {
                                data.css('display', 'table-row-group');
                                return;
                            } else {
                                data.css('display', 'none')
                            }
                            var items = $(data).filter(':contains(' + searchValue + ')');
//                if (items.length > 5) {
//                    $('.h288').css('height', '302px')
//                } else {
//                    $('.h288').css('height', (49 * items.length) + 'px')
//                }
                            items.css('display', 'table-row-group');
                            // END IGOR
                        }}
                );
            // subMenuSearchItemFavorIcon = $('<div>', {class: 't-btn-favor'});


            subMenuSearchItem.append(subMenuSearchItemSearchIcon);
            subMenuSearchItem.append(subMenuSearchItemSearchInput);

            // If the Search Area has addUserBlock then it also does not need a favor icon
            if(addUserBlock){
                subMenuSearchItem.attr('class', 't-window_head t-window_head__t-conf');
                subMenuSearchItem.prepend($('<div>', {id: 't-window_btn2', class: 't-btn-conf'}));
            } else {
                //subMenuSearchItem.append(subMenuSearchItemFavorIcon);
            };

            return subMenuSearchItem;
        };

        // Change 'status' menu
        var changeStatusMenu = function ($) {
            var changeStatusMenu = $('<div>', {
                class: 't-window',
                id: 'changeStatusMenu'
            });
            var changeStatusMenuWrapper = $('<div>', {
                class: 'window-wrap'
            });

            // changeStautsMenusForm
            var changeStatusMenuHeader = $('<h3>', {
                    text: (ENG_LNG)? 'Status' : 'Смена статуса'
                }),
                changeStatusMenuForm = $('<form>', {
                    action: '',
                    class: 't-form1',
                    id: 'status-break-form'
                });
            // Form Container
            // First Select in the Form
            var changeStatusMenuFormContainer = $('<div>', {
                    class: 't-line'
                }),
                selectField = $('<select>', {
                    id: 'state'
                });

            for (var key in WebitelPanelAccountAwayCauseTypes) {
                var option = $('<option>', {
                    value: WebitelUserAwayCauseTypes[key],
                    text: WebitelPanelAccountAwayCauseTypes[key]
                });
                selectField.append(option);
            };
            changeStatusMenuFormContainer.append(selectField);
            changeStatusMenuForm.append(changeStatusMenuFormContainer);

            // Filling the second selectField
            // var changeStatusMenuFormContainer = $('<div>', {
            //       class: 't-line'
            //     }),
            //     selectField = $('<select>', {id: 'away'}),
            //     option1 = $('<option>', {
            //       value: '',
            //       text: 'Обеденное время'
            //     }),
            //     option2 = $('<option>', {
            //       value: '',
            //       text: 'Обеденное время 2'
            //     });
            // selectField.append(option1).append(option2);
            // changeStatusMenuFormContainer.append(selectField);
            // changeStatusMenuForm.append(changeStatusMenuFormContainer);

            // Filling the third input field of the form
            var changeStatusMenuFormContainer = $('<div>', {
                    class: 't-line'
                }),
                textarea = $('<textarea>', {
                    id: 'tag',
                    cols: '30',
                    rows: '10',
                    placeholder: (ENG_LNG)? 'Comment' : 'Комментарий'
                });
            changeStatusMenuFormContainer.append(textarea);
            changeStatusMenuForm.append(changeStatusMenuFormContainer);

            // Appending Submit Button to the Form
            var changeStatusMenuFormContainer = $('<div>', {
                    class: 't-line'
                }),
                submitStatusChangeButton = $('<input>', {
                    type: 'submit',
                    class: 't-submit',
                    value: (ENG_LNG)? 'Change status' : 'Сменить статус'
                });
            changeStatusMenuFormContainer.addClass('t-btn_line');
            changeStatusMenuFormContainer.append(submitStatusChangeButton);
            changeStatusMenuForm.append(changeStatusMenuFormContainer);

            // Appending Form and Header to the MenuWrapper
            changeStatusMenuWrapper
                .append(changeStatusMenuHeader)
                .append(changeStatusMenuForm);

            // Appending MenuWrapper to the mainMenu
            changeStatusMenu.append(changeStatusMenuWrapper);

            //$('select').selectBox({
            //    autoWidth:true
            //});
            return changeStatusMenu;
        };

        // IGOR
        var changeContactMenu = function ($) {
            var changeStatusMenu = $('<div>', {
                class: 't-window',
                id: 'changeContactMenu'
            });
            var changeStatusMenuWrapper = $('<div>', {
                class: 'window-wrap'
            });

            // changeStautsMenusForm
            var changeStatusMenuHeader = $('<h3>', {
                    text: 'Выбор абонента'
                }),
                changeStatusMenuForm = $('<form>', {
                    action: '',
                    class: 't-form1',
                    id: 'w-change-contact-form'
                }).css('padding', '5px');
            // Form Container
            // First Select in the Form
            var changeStatusMenuFormContainer = $('<div>', {
                    class: 't-line'
                }),
                selectField = $('<select>', {
                    id: 'contacts',
                    class: 'selectBox selectBox-dropdown'
                }),
                submitButton = $('<input>', {
                    type: 'submit',
                    class: 't-submit',
                    value: 'OK'
                });
            changeStatusMenuFormContainer.append(selectField);
            changeStatusMenuForm.append(changeStatusMenuFormContainer, submitButton);



            // Appending Form and Header to the MenuWrapper
            changeStatusMenuWrapper
                .append(changeStatusMenuHeader)
                .append(changeStatusMenuForm);

            // Appending MenuWrapper to the mainMenu
            changeStatusMenu.append(changeStatusMenuWrapper);

//            $('select').selectBox({
//                autoWidth:true
//            });
            return changeStatusMenu;
        };

        var userSettingsMenu = function ($) {
            var changeStatusMenu = $('<div>', {
                class: 't-window',
                id: 'userSettings'
            });
            var changeStatusMenuWrapper = $('<div>', {
                class: 'window-wrap'
            });

            // changeStautsMenusForm
            var changeStatusMenuHeader = $('<h3>', {
                    text: (ENG_LNG)? 'Settings' : 'Настройки'
                }),
                changeStatusMenuForm = $('<form>', {
                    action: '',
                    class: 't-form1',
                    id: 'webitel-settings-change-form'
                }).css('padding', '5px');
            // Form Container
            // First Select in the Form
            var loginFormContainer = $('<div>', {
                    class: 't-line'
                }),
                loginFieldCaption = $('<div>', {
                    text: (ENG_LNG)? 'Login' : 'Логин'
                }),
                loginField = $('<input>', {
                    id: 'w-login',
                    class: 'input-webitel'
                }),
                passwordFormContainer = $('<div>', {
                    class: 't-line'
                }),
                passwordFieldCaption = $('<div>', {
                    text: (ENG_LNG)? 'Password' : 'Пароль'
                }),
                passwordField = $('<input>', {
                    id: 'w-password',
                    class: 'input-webitel',
                    type: 'password'
                }),
                submitButton = $('<input>', {
                    type: 'submit',
                    class: 't-submit',
                    value: (ENG_LNG)? 'Save' : 'Сохранить'
                });
            loginFormContainer.append(loginFieldCaption, loginField);
            passwordFormContainer.append(passwordFieldCaption, passwordField);
            changeStatusMenuForm.append(loginFormContainer, passwordFormContainer, submitButton);



            // Appending Form and Header to the MenuWrapper
            changeStatusMenuWrapper
                .append(changeStatusMenuHeader)
                .append(changeStatusMenuForm);

            // Appending MenuWrapper to the mainMenu
            changeStatusMenu.append(changeStatusMenuWrapper);

            return changeStatusMenu;
        };

        var userSettingsMenuEvents = function ($) {
            $(document).ready(function() {
                $('form#webitel-settings-change-form').submit(function() {
                    var $this = $(this);
                    var login = $this.find('#w-login').val();
                    var pass = $this.find('#w-password').val();
                    OnSettingsChange.trigger({pass: pass, log: login});
                    $.modal.close();
                    return false
                });
            });
        }
        //ENDIGOR

        /*----------------DOM EVENTS-----------------------*/
        // Appending events to the DOM on the call actions
        var webitelPanelCallEvents = function ($) {
            $(document).ready(function() {
                // OnNewCall
                $('.t-phone_num_call-btn').click(function (e) {
                    var $this = $(this),
                        $parent = $this.parent(),
                        dialedNumber = $parent.find('input').val();
                    if (CALLFORWARDING.uuid && dialedNumber) {
                        CALLFORWARDING.number = dialedNumber;
                        OnTransferCall.trigger(CALLFORWARDING);
                        return
                    }
                    if(dialedNumber){
                        OnNewCall.trigger(dialedNumber);
                    };
                });

                // OnHangUpCall
                $('.t-alert').on('click', 'a.t-btn__end', function (e) {
                    var $tableRow = $(this).closest('tr'),
                        callUuid = $tableRow.attr('id');

                    OnHangUpCall.trigger(callUuid);
                    return false;
                });

                // OnCallForwarding
                $('.t-alert').on('click', 'a.t-btn__call-2', function (e) {
                    var $this = $(this),
                        userNumber = $this.closest('tr').find('.t-usernum').text();
                    console.log('Call Forwarding triggered on call ' + userNumber)
                    OnCallForwarding.trigger(userNumber);

                    CALLFORWARDING = {
                        uuid:  $this.closest('tr').attr('id'),
                        number: ''
                    }

                    $('.t-calls').find('.t-phone_num_call-btn').css('background-color', '#f07b0e');
                    $('.t-calls').find('.t-menu_item').click();
                    return false;
                });
                // OnHoldCall
                $('.t-alert').on('click', 'a.t-btn__pause', function (e) {
                    var $this = $(this),
                        uuid = $this.closest('tr').attr('id');
                    OnHoldCall.trigger(uuid);
                    return false;
                });

                $('.t-alert').on('click', 'a.t-btn__call', function (e) {
                    var $this = $(this),
                        $tr = $this.closest('tr'),
                        callStatus = $tr.attr('data-call-status'),
                        uuid = $tr.attr('id');
                    switch(callStatus){
                        case 'NewCall':
                            OnAcceptCall.trigger(uuid);
                            break;
                        case 'Hold':
                            OnRetrieveCall.trigger(uuid);
                            break;
                    }
                    return false;
                });
            });
        };

        // Appending Status Events to the DOM
        var webitelPanelStatusEvents = function ($) {
            $(document).ready(function() {
                $('#status-ready').click(function (e) {
                    var $parentMenu = $(this).closest('.t-status-select'),
                        $id = $(this).attr('id'),
                        changeStatusTo = {
                            id: $id
                        };
                    OnStatusChange.trigger(changeStatusTo);
                    $parentMenu.find('.t-menu_item').trigger('click');
                });

                /*------SubmitStaus break menu-------*/
                $('form#status-break-form').submit(function() {
                    var $this = $(this);
                    var changeStatusTo = {
                        id: 'status-break',
                        statusInfo: {
                            state: $this.find('select#state option:selected').val(),
                            tag: $this.find('textarea#tag').val()
                        }
                    };
                    OnStatusChange.trigger(changeStatusTo);
                    $.modal.close();
                    return false
                });
            });
        };


        var webitelPanelContactMenuEvents = function ($) {
            $(document).ready(function() {
                /*------SubmitStaus break menu-------*/
                $('form#w-change-contact-form').submit(function() {
                    try {
                        var $this = $(this);
                        var $selectedItem = $this.find('select#contacts option:selected');
                        var pageEdit = $selectedItem.attr('pagename');
                        var recordId = $selectedItem.val();
                        var name = $selectedItem.text();
                        var $call = $('tr#' + $selectedItem.attr('callkey'));
                        var $username = $call.find('.t-username');
                        $username.text(name);
                        var photoId = $selectedItem.attr('photoId');
                        $username.unbind('click');
                        for (var key in AlertMenuObjectsArray) {
                            if (AlertMenuObjectsArray[key].id == $selectedItem.attr('callkey') ||
                                AlertMenuObjectsArray[key].oldId == $selectedItem.attr('callkey')) {
                                if (photoId) {
                                    var imageConfig = {
                                        source: '', //Terrasoft.ImageSources.SYS_IMAGE,
                                        params: {
                                            primaryColumnValue: photoId
                                        }
                                    };
                                    var img = ''//Terrasoft.ImageUrlBuilder.getUrl(imageConfig);
                                    AlertMenuObjectsArray[key].userpic.src = img;
                                    $call.find('img').attr('src', img)
                                }
                                AlertMenuObjectsArray[key].username = name;
                            }
                        }
                        $username.click(function() {
                            //  var token = 'CardModule' + '/' + pageEdit + '/edit/' + recordId;
                            // Terrasoft.Router.pushState(null, null, token);
                            var url = 'SectionModuleV2/' +  pageEdit  + '/edit/' + recordId;
                            var sandbox = configuration['sandbox'];
                            sandbox.publish("PushHistoryState", { hash: url });
                        });
                        $.modal.close();
                    } catch (e){

                    } finally {
                        return false
                    }
                });
            });
        };
        /*----------------END of the DOM EVENTS-----------------------*/

        function fullScreen(element) {
            if(element.requestFullscreen) {
                element.requestFullscreen();
            } else if(element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if(element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if(element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        };

        function fullScreenCancel() {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }

        function toggleFullScreen(element) {
            if (!document.fullscreenElement &&    // alternative standard method
                !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods

                fullScreen(element);
            } else {
                fullScreenCancel(element);
            }
        }

        var UIEvents = function ($) {
            webitelPanelStatusEvents($);
            webitelPanelCallEvents($);
            userSettingsMenuEvents($);
            webitelPanelContactMenuEvents($);

            MicControl.onMute.subscribe(function () {
                // TODO
            });

            MicControl.onUnMute.subscribe(function () {
                // TODO
            })

            $(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {
                var $videoContainer = jQuery('.t-webitel-video'),
                    $outgoingVideo = $videoContainer.find('#OutgoingVideo'),
                    $videoControls = $videoContainer.find('.t-video-controls');

                if (!document.fullscreenElement &&    // alternative standard method
                    !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods

                    $outgoingVideo.removeClass('OutgoingVideo-full__on').addClass('OutgoingVideo-full__off');
                    $videoControls.removeClass('t-video-controls-full__on').addClass('t-video-controls-full__off');
                } else {
                    $outgoingVideo.removeClass('OutgoingVideo-full__off').addClass('OutgoingVideo-full__on');
                    $videoControls.removeClass('t-video-controls-full__off').addClass('t-video-controls-full__on');
                }
            });
            $(document).ready(function() {
                var jQuery = $;
                $('.t-video-controls-btn-full').click(function() {
                    var OutgoingVideo = document.getElementById("OutgoingVideo");
                    toggleFullScreen(OutgoingVideo);
                });

                $('.t-video-controls-btn-mute').click(function() {
                    var video = $(this);
                    var videoOn = $(this).hasClass('t-video-controls-btn-mute__on');
                    if(videoOn) {
                        VideoControl.mute();
                        video.removeClass('t-video-controls-btn-mute__on').addClass('t-video-controls-btn-mute__off');
                    } else {
                        VideoControl.unMute();
                        video.removeClass('t-video-controls-btn-mute__off').addClass('t-video-controls-btn-mute__on');
                    }
                });

                $('.t-menu_item').click(function() {
                    var menu_el = $(this).parent();
                    if (!menu_el.hasClass('t-calls')) {
                        $('.t-phone_num_call-btn').css('background-color', '#00bb00');
                        CALLFORWARDING = {};
                    }
                    if ($(menu_el).hasClass('active')) {
                        $(menu_el).removeClass('active').children('.t-content').slideUp(300);
                        $('.t-phone_num').hide();
                        $('.t-menu-overlay').hide(0);
                    } else {
                        $('.t-menu li.active').removeClass('active').children('.t-content').slideUp(300);
                        $('.t-phone_num').hide();
                        $(menu_el).addClass('active').children('.t-content').slideDown(300, function() {
                            // $(menu_el).find('.t-window_head input[type=text]').focus().val('');
                        });
                        $('.t-menu-overlay').show(0);
                    }

                    if (AlertMenuObjectsArray.length > 0 && menu_el.hasClass('t-alert') && !$('.t-hide-menu-btn').hasClass('t-hide-menu-btn__hidden')) {
                        $('.t-hide-menu-btn').click()
                    }
                    return false;
                });

                $('.t-menu-overlay').click(function() {
                    $(this).hide(0);
                    $('.t-menu li.active').removeClass('active').children('.t-content').slideUp(300);
                });

                var menu_hide_btn = $('.t-hide-menu-btn');

                $(menu_hide_btn).click(function() {
                    if ($(menu_hide_btn).hasClass('t-hide-menu-btn__hidden')) {
                        $('.t-menu .t-longer_menu_item').animate({
                            width: 0
                        }, 300, function() {
                            $(menu_hide_btn).removeClass('t-hide-menu-btn__hidden');
                        });
                        $('.t-longer_menu_item.active').removeClass('active').find('.t-content').hide();
                        $('.t-alert.active').removeClass('active').find('.t-content').hide();
                    } else {
                        $('.t-menu .t-longer_menu_item').animate({
                            width: '59px'
                        }, 300, function() {
                            $(menu_hide_btn).addClass('t-hide-menu-btn__hidden');
                        });
                    }
                });
                /*
                 $(menu_hide_btn).not('.t-hide-menu-btn__hidden').click(function(){
                 $('.t-menu .t-longer_menu_item').animate({width:'60px'},300,function(){
                 $(menu_hide_btn).addClass('t-hide-menu-btn__hidden');
                 });
                 });
                 $(menu_hide_btn).hasClass('t-hide-menu-btn__hidden').click(function(){
                 $('.t-menu .t-longer_menu_item').animate({width:0},300,function(){
                 $(menu_hide_btn).removeClass('t-hide-menu-btn__hidden');
                 });
                 });
                 */

                $('.t-phone_num-btn').click(function() {
                    $('.t-phone_num').slideToggle(300);
                });

                $('.t-mute_btn , .t-big_video_menu a').click(function() {
                    $(this).toggleClass('active');
                    return false;
                });

                /*-------simple modal--------------*/
                $('#status-break').click(function() {
                    var $parentMenu = $(this).closest('.t-status-select');
                    $('#changeStatusMenu').modal({
                        overlayClose: true,
                        closeClass: 'modalClose',
                        onOpen: function(dialog) {
                            $('select', dialog.data[0]).selectBox({ autoWidth: false });
                            dialog.overlay.fadeIn('fast', function() {
                                dialog.data.hide();
                                dialog.container.fadeIn('fast', function() {
                                    dialog.data.fadeIn('fast');
                                });
                            });
                        },
                        onClose: function(dialog) {
                            dialog.data.fadeOut('fast', function() {
                                dialog.container.hide('fast', function() {
                                    dialog.overlay.fadeOut('fast', function() {
                                        $.modal.close();
                                    });
                                });
                            });
                            // $('.selectBox-options').remove();
                        }
                    });
                    $parentMenu.find('.t-menu_item').trigger('click');
                    return false;
                });

                $('#t-window_btn2').click(function() {
                    $("#t-window2").modal({
                        overlayClose: true,
                        closeClass: 'modalClose',
                        onOpen: function(dialog) {
                            dialog.overlay.fadeIn('fast', function() {
                                dialog.data.hide();
                                dialog.container.fadeIn('fast', function() {
                                    dialog.data.fadeIn('fast');
                                });
                            });
                        },
                        onClose: function(dialog) {
                            dialog.data.fadeOut('fast', function() {
                                dialog.container.hide('fast', function() {
                                    dialog.overlay.fadeOut('fast', function() {
                                        $.modal.close();
                                    });
                                });
                            })
                        }
                    });
                    return false;
                });

                var big_video_window_width = 642,
                    big_video_window_height = 449;

                $('#t-call_window_small .t-fullscreen_btn').click(function() {
                    $("#t-window3").modal({
                        overlayClose: false,
                        closeClass: 't-big_video_close',
                        containerCss: {
                            width: big_video_window_width,
                            height: big_video_window_height
                        },
                        onOpen: function(dialog) {

                            $('#t-bid_video').css({
                                width: big_video_window_width,
                                height: big_video_window_height
                            });

                            dialog.overlay.addClass('t-big_video_overlay').fadeIn('fast', function() {
                                dialog.data.hide();
                                dialog.container.fadeIn('fast', function() {
                                    dialog.data.fadeIn('fast');
                                });
                            });
                        },
                        onClose: function(dialog) {
                            dialog.data.fadeOut('fast', function() {
                                dialog.container.hide('fast', function() {
                                    dialog.overlay.removeClass('t-big_video_overlay').fadeOut('fast', function() {
                                        $.modal.close();
                                    });
                                });
                            })
                        }
                    });
                    return false;
                });

                /*----------scrollpane---------*/
                var pane_params = {
                    scrollbarWidth: 19,
                    autoReinitialise: true,
                    verticalDragMaxHeight: 200,
                    // contentWidth: 100,
                    verticalDragMinHeight: 15,
                    verticalGutter: 0
                };

                var scrollPane = $('.pane').jScrollPane(pane_params);

                /*----------check box----------*/
                function changeCheck(el) {
                    var el = el,
                        input = el.find("input").eq(0);
                    if (!input.attr("checked")) {
                        el.addClass('chkd');
                        input.attr("checked", true)
                    } else {
                        el.removeClass('chkd');
                        input.attr("checked", false)
                    }
                    return true;
                };

                function changeCheckStart(el) {
                    var el = el,
                        input = el.find("input").eq(0);
                    el.find('span').prepend(el.find("input").attr('value'));
                    if (input.attr("checked")) {
                        el.addClass('chkd');
                    }
                    if (input.attr("disabled")) {
                        el.fadeTo(100, 0.6);
                    };
                    return true;
                };

                jQuery(".niceCheck").click(function() {
                    changeCheck(jQuery(this));
                });
                jQuery(".niceCheck").each(function() {
                    changeCheckStart(jQuery(this));
                });

                /*----end-------checkbox------------------*/

                /*---------------dialpad------------------*/

                var phone_number = $('.t-phone input')[0];

                $('.t-phone_num li').click(function() {
                    if (AlertMenuObjectsArray.length > 0) {
                        for (var key in AlertMenuObjectsArray) {
                            if (AlertMenuObjectsArray[key]['holdState'] === 0) {
                                webitel.dtmf(AlertMenuObjectsArray[key].webitelCallId, $(this).text())
                                return;
                            }
                        }
                        return;
                    };
                    var $phone_number = $(phone_number);
                    $phone_number.val($phone_number.val() + $(this).text());
                });

                $('.t-status-select_mic').click(function(){
                    var mic = $(this);
                    var micOn = $(this).hasClass('t-status-select_mic__on');
                    if(micOn) {
                        MicControl.mute();
                        mic.removeClass('t-status-select_mic__on').addClass('t-status-select_mic__off');
                    } else {
                        MicControl.unMute();
                        mic.removeClass('t-status-select_mic__off').addClass('t-status-select_mic__on');
                    }
                });


                $('.t-status-select_can').click(function(){
                    var cam = $(this);
                    var camOn = $(this).hasClass('t-status-select_can__on');
                    if(camOn) {
                        VideoControl.off();
                        cam.removeClass('t-status-select_can__on').addClass('t-status-select_can__off');
                    } else {
                        VideoControl.on();
                        cam.removeClass('t-status-select_can__off').addClass('t-status-select_can__on');
                    }
                    OnUseVideoChange.trigger(!camOn);
                });

                /*----------------------------------------*/

                /*---simple-tooltip-------*/
                var tooltip_structure = '<div id="tooltip"></div>';
                $('body').append(tooltip_structure);

                function show_ttip() {
                    var titl = $(this).attr('title');
                    $(this).removeAttr('title');
                    $("#tooltip").delay(1000).fadeIn(100).html(titl);
                }

                function move_ttip(kmouse) {
                    $("#tooltip").css({
                        left: kmouse.pageX + 18,
                        top: kmouse.pageY - 18
                    });
                }

                function hide_ttip() {
                    $(this).attr('title', $('#tooltip').html());
                    $("#tooltip").fadeOut('fast');
                }
                $(".tooltip").mouseenter(show_ttip);
                $(".tooltip").mousemove(move_ttip);
                $(".tooltip").mouseout(hide_ttip);
                /*--end--tooltip-------*/
            });
        };

        // Get Account, Countact information
        function getIdentifyContactQuery(callerReverse) {
            /*
             var esq = Ext.create('Terrasoft.EntitySchemaQuery', {
             rootSchemaName: 'Contact',
             isDistinct: true,
             rowCount: 3
             });
             esq.addColumn('Id', 'ContactId');
             esq.addColumn('Name', 'ContactName');
             esq.addColumn('Photo', 'Photo');
             esq.addColumn('Account.Id', 'AccountId');
             esq.addColumn('Account.Name', 'AccountName');
             esq.addColumn('[ContactCommunication:Contact:Id].CommunicationType', 'CommunicationType');
             esq.filters.add('SearchNumberFilter',
             Terrasoft.createColumnFilterWithParameter(
             Terrasoft.ComparisonType.START_WITH,
             '[ContactCommunication:Contact:Id].SearchNumber',
             callerReverse
             )
             );
             return esq;
             */
        };

        function getIdentifyAccountQuery(callerReverse) {
            var esq = Ext.create('Terrasoft.EntitySchemaQuery', {
                rootSchemaName: 'Account',
                isDistinct: true,
                rowCount: 3

            });
            esq.addColumn('Id', 'AccountId');
            esq.addColumn('Name', 'AccountName');
            esq.addColumn('PrimaryContact.Id', 'ContactId');
            esq.addColumn('PrimaryContact.Name', 'ContactName');
            esq.addColumn('[AccountCommunication:Account:Id].CommunicationType', 'CommunicationType');
            esq.filters.add('SearchNumberFilter',
                Terrasoft.createColumnFilterWithParameter(
                    Terrasoft.ComparisonType.START_WITH,
                    '[AccountCommunication:Account:Id].SearchNumber',
                    callerReverse
                )
            );
            return esq;
        }

        function getIdentifyLeadQuery(caller) {
            var esq = Ext.create('Terrasoft.EntitySchemaQuery', {
                rootSchemaName: 'Lead',
                isDistinct: true,
                rowCount: 3
            });
            esq.addColumn('Id', 'LeadId');
            esq.addColumn('LeadName');
            esq.addColumn('Account');
            esq.addColumn('Contact');
            esq.addColumn('BusinesPhone');
            esq.addColumn('MobilePhone');
            var filterGroup = Terrasoft.createFilterGroup();
            filterGroup.name = 'SearchNumberFilter';
            filterGroup.logicalOperation = Terrasoft.LogicalOperatorType.OR;
            var filter = Terrasoft.createColumnFilterWithParameter(
                Terrasoft.ComparisonType.START_WITH,
                'MobilePhone',
                caller);
            filterGroup.addItem(filter);
            filter = Terrasoft.createColumnFilterWithParameter(
                Terrasoft.ComparisonType.START_WITH,
                'BusinesPhone',
                caller);
            filterGroup.addItem(filter);
            esq.filters.add("SearchNumberFilter", filterGroup);
            return esq;
        }

        function setIdentifyCollection (callId, collect) {
            for (var key in AlertMenuObjectsArray) {
                if (AlertMenuObjectsArray[key].id == callId || AlertMenuObjectsArray[key].oldId == callId) {
                    AlertMenuObjectsArray[key].identifyCollection = collect;
                    return key;
                }
            }
        }

        function getAccountSelectTest($, callNumber, callId) {

        }

        function tryGetOpenCardConfig(schemaName, urlType, columnTypeCode, mode) {

        };
        // End

        // WebitelPanel UI actions on subscribtion
        var WebitelPanelActions = {
            setNumber: function ($, number) {
                $('#current-agent-phone-number').text(number);
            },
            setStatus: function ($, status) {
                $('#status').text(status);
            },
            showCallInfo: function ($, key) {
                var alertMenu = $('.t-alert');
                //alertMenu.find('table').remove();
                // alertMenu.find('.t-content').append(menuAlertCallInfoArea($));
                addMenuAlertCallInfoArea($, key);

                if (!alertMenu.hasClass('active')) {
                    alertMenu.find('.t-menu_item').click();
                }

                // IGOR
                $('.t-book').find('.t-btn__call-2').css('display', 'block')
                alertMenu.find('.t-menu_item').find('.t-menu_messages-am').remove();
                alertMenu.find('.t-menu_item').append($('<span>', {
                    class: 't-menu_messages-am',
                    text: AlertMenuObjectsArray.length
                }));
                // END IGOR
            },
            answeredCall: function($, call, keyCall) {
                var keyCall = getCallKeyFromCallId(call['uuid']);
                var currentCallTableRow = $('tr#' + AlertMenuObjectsArray[keyCall]['id']),
                    retrieveCallButton = currentCallTableRow.find('a.t-btn__call');
                retrieveCallButton.removeClass('t-btn__call').addClass('t-btn__pause');
                currentCallTableRow.removeClass('t-status__07').addClass('t-status__01');
                if (!IS_WEBRTC && keyCall) {
                    // currentCallTableRow.find('.t-alert-box__first a').addClass(AlertMenuObjectsArray[keyCall].callDirectionClass);
                    currentCallTableRow.find('.t-alert-box__first a').addClass('t-btn t-btn__pause' /*AlertMenuObjectsArray[keyCall].callDirectionClass*/);
                }
            },
            holdCall: function ($, callUuid) {
                var keyCall = getCallKeyFromCallId(callUuid);
                AlertMenuObjectsArray[keyCall]['holdState'] = WebitelPanelHoldState.Hold;
                var currentCallTableRow = $('tr#' + AlertMenuObjectsArray[keyCall]['id']),
                    holdButton = currentCallTableRow.find('.t-btn__pause');
                holdButton.removeClass('t-btn__pause').addClass('t-btn__call');
                currentCallTableRow.attr('data-call-status', 'Hold');
                currentCallTableRow.toggleClass('t-status__02');
            },
            unholdCall: function ($, callUuid) {
                var keyCall = getCallKeyFromCallId(callUuid);
                AlertMenuObjectsArray[keyCall]['holdState'] = WebitelPanelHoldState.UnHold;
                var currentCallTableRow = $('tr#' + AlertMenuObjectsArray[keyCall]['id']),
                    retrieveCallButton = currentCallTableRow.find('.t-btn__call');
                retrieveCallButton.removeClass('t-btn__call').addClass('t-btn__pause');
                currentCallTableRow.toggleClass('t-status__02');
            },
            hangUpCall: function ($, callUuid) {
                var keyCall = getCallKeyFromCallId(callUuid);
                var uuid = AlertMenuObjectsArray[keyCall]['id'];
                var $userLineToDelete = $('.t-alert').find('#' + uuid);
                $userLineToDelete.hide('slow', function(){ $userLineToDelete.remove() });
                for (var key in AlertMenuObjectsArray) {
                    if(AlertMenuObjectsArray[key].id == uuid) {
                        AlertMenuObjectsArray[key].timer.stop();
                        // IGOR
                        try {
                            addMenuRecent($, (RECENT_EVENTS.push(AlertMenuObjectsArray[key]) - 1));
                        } catch (e) {

                        }
                        //
                        AlertMenuObjectsArray.splice(key, 1);
                    }
                };

                var alertMenu = $('.t-alert');
                alertMenu.find('.t-menu_messages-am').remove();
                if (AlertMenuObjectsArray.length  > 0 ) {
                    alertMenu.find('.t-menu_item').append($('<span>', {
                        class: 't-menu_messages-am',
                        text: AlertMenuObjectsArray.length
                    }));
                } else {
                    $('.t-book').find('.t-btn__call-2').css('display', 'none');
                }
            }
        };
        // WebitelPanel UI actions on subscribtion

        /*-----------------WebitelPanelEventsSubscribers-----------------------*/
        var webitelPanelEventsSubscribers = function ($) {
            OnTransferCall.subscribe(function (transfer) {
                $('.t-alert').find('.t-menu_item').click();
                webitel.transfer(transfer.uuid, transfer.number);
            });
            OnStatusChange.subscribe(function (newStatus) {
                switch(newStatus.id){
                    case 'status-ready':
                        webitel.ready();
                        break;
                    case 'status-break':
                        var state = newStatus.statusInfo.state,
                            tag = newStatus.statusInfo.tag;
                        webitel.busy(state, tag);
                        break;
                }
            });
            OnNewCall.subscribe(function (number) {
                webitel.call(number, VideoControl.status());
            });
            OnAcceptCall.subscribe(function (id) {
                var keyCall = getCallKeyFromCallId(id);
                if (!AlertMenuObjectsArray[keyCall])
                    return
                var uuid = AlertMenuObjectsArray[keyCall]['webitelCallId'];
                webitel.answer(uuid);
            });
            OnHangUpCall.subscribe(function(id) {
                var keyCall = getCallKeyFromCallId(id);
                if (!AlertMenuObjectsArray[keyCall])
                    return
                var uuid = AlertMenuObjectsArray[keyCall]['webitelCallId'];
                webitel.hangup(uuid);
            });
            OnHoldCall.subscribe(function(id) {
                var keyCall = getCallKeyFromCallId(id);
                if (!AlertMenuObjectsArray[keyCall])
                    return
                var uuid = AlertMenuObjectsArray[keyCall]['webitelCallId'];
                webitel.hold(uuid);
            });
            OnRetrieveCall.subscribe(function (id) {
                var keyCall = getCallKeyFromCallId(id);
                if (!AlertMenuObjectsArray[keyCall])
                    return
                var uuid = AlertMenuObjectsArray[keyCall]['webitelCallId'];
                webitel.unhold(uuid);
            });
        };

        function getAgentClassStatus (agent) {
            var statusCls = 't-status__04';
            if (agent['state'] === WebitelAccountStatusTypes.Ready ) {
                statusCls = 't-status__01';
            } else if (agent['state'] === WebitelAccountStatusTypes.Busy &&
                agent['away'] == WebitelUserAwayCauseTypes.None) {
                statusCls = 't-status__03';
            }else if (agent['state'] === WebitelAccountStatusTypes.Busy && agent['away']) {
                statusCls = 't-status__02';
            } else if (agent['state'] === WebitelAccountStatusTypes.Unregistered) {
                statusCls = 't-status__04';
            }
            return statusCls;
        };
        /// IGOR
        function addAcountBookList ($, key) {
            var tableBook = $('.t-book').find('table');
            var subMenuBookListTableRowData = [
                {class: 't-status'},
                {class: 't-box-btn-favor', innerHtml: {tag: '<div>', attrs: {class: 't-btn-favor webitel-def-comp', click: function() {
                    var number = $(this).parent().parent().find('.t-usernum').text();
                    setUserFavorites($, number, $(this));
                }}}},
                {class: 't-userpic', innerHtml: {tag: '<img>', attrs: {width: '31px', height: '31px', innerValue: 'userpic'}}},
                {class: 't-username', innerValue: 'username', innerHtml: {}},
                {class: 't-usernum', innerValue: 'number', innerHtml: {}},
                {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {class: 't-btn t-btn__call', click: function() {
                    var $this = $(this),
                        $parent = $this.parent(),
                        dialedNumber = $parent.parent().find('.t-usernum').text();
                    if(dialedNumber){
                        OnNewCall.trigger(dialedNumber);
                    };
                }}}},
                {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {class: 't-btn t-btn__call-2', style: "display: none;",
                    click: function () {
                        var $this = $(this),
                            $parent = $this.parent(),
                            dialedNumber = $parent.parent().find('.t-usernum').text();
                        if(dialedNumber){
                            OnTransferCall.trigger({
                                uuid: AlertMenuObjectsArray[0].id,
                                number: dialedNumber
                            });
                        };
                    }}}}
            ];

            // Fill in the table with table rows which equals to the BOOK_LIST array length
            // We iterate through BOOK_LIST
            // On every event separate tr is created

            var tableRowContent = $('<tr>', {id: CONTACT_PREF + BOOK_LIST[key]['number']});
            // Here we iterate through the row data to know how many td is needed
            for (var i in subMenuBookListTableRowData) {
                var innerHtml = subMenuBookListTableRowData[i].innerHtml,
                    innerValue = subMenuBookListTableRowData[i].innerValue;

                // Here we create inner html structure if neccessary
                if(innerHtml || innerValue){

                    // if we need to fill in data dynamically from the server to the innerHtml
                    if(innerHtml.attrs && innerHtml.attrs.innerValue){
                        var innerHtmlValue = innerHtml.attrs.innerValue;

                        for (var property in BOOK_LIST[key][innerHtmlValue]){
                            innerHtml.attrs[property] = BOOK_LIST[key][innerHtmlValue][property]
                        };
                    };

                    // Filling the table row with data
                    tableRowContent
                        .append($('<td>', {
                                class: subMenuBookListTableRowData[i].class,
                                text: BOOK_LIST[key][innerValue]
                            })
                                .append($(innerHtml.tag, innerHtml.attrs))
                        )
                    // Removing helper innerValue from the DOM elements
                    if(tableRowContent.find('[innerValue]')[0]){
                        tableRowContent.find('[innerValue]')[0].removeAttribute('innerValue')
                    };
                } else {
                    // Filling the table row with data if there is no innerHtml structure
                    tableRowContent.append(
                        $('<td>', {class: subMenuBookListTableRowData[i].class})
                    )
                };
            };
            // append TableRow to the table
            tableBook.append(tableRowContent.toggleClass(BOOK_LIST[key].class));
        };

        function addFavorite($, containerUsr) {
            var key = FAVOURITES.push(
                {
                    class: containerUsr.attr('class'),
                    number: containerUsr.find('.t-usernum').text(),
                    username: containerUsr.find('.t-username').text(),
                    userpic: {src: containerUsr.find('img').attr('src')}
                });
            addMenuFavourites($, key - 1);
        }

        function loadUserFavorites ($) {
            /*
             var data = {userId: Terrasoft.SysValue.CURRENT_USER_CONTACT.value};
             callMethods('GetUserFavorites', data, function(request, success, response){
             var responseObject = {};

             if (success) {
             responseObject = Terrasoft.decode(response.responseText);
             var response = responseObject.GetUserFavoritesResult;
             for (key in response) {
             var containerUsr = $('#' + CONTACT_PREF + response[key]['number']);
             containerUsr.find('.t-box-btn-favor').addClass('t-favor__true');
             addFavorite($, containerUsr);
             }
             }
             });

             var numberList = [];
             for (var key in BOOK_LIST) {
             numberList.push(BOOK_LIST[key]['number'].split("").reverse().join(""));
             };
             if (numberList.length == 0) return;

             var esq = Ext.create('Terrasoft.EntitySchemaQuery', {
             rootSchema: ContactCommunication,
             isDistinct: true
             });
             esq.addColumn('SearchNumber', 'SearchNumber');
             esq.addColumn('Contact.Photo', 'Photo');

             var existsItemsFilter = Terrasoft.createColumnInFilterWithParameters('SearchNumber',
             numberList);
             existsItemsFilter.comparisonType = Terrasoft.ComparisonType.EQUAL;

             esq.filters.add(existsItemsFilter);
             esq.filters.add('notNullPhoto', Terrasoft.createColumnIsNotNullFilter('Contact.Photo'));

             esq.getEntityCollection(function(result) {
             if (result.success) {
             Terrasoft.each(result.collection.getItems(), function(item) {
             var imageConfig = {
             source: Terrasoft.ImageSources.SYS_IMAGE,
             params: {
             primaryColumnValue: item.get('Photo').value
             }
             };
             var img = Terrasoft.ImageUrlBuilder.getUrl(imageConfig);
             var number = item.get('SearchNumber').split("").reverse().join("");
             var $bookPic = $('.t-book').find('table').find('#' + CONTACT_PREF + number).find('img');
             var $favorPic = $('.t-favor').find('table').find('#favor-webitel-agen-' + number).find('img');
             $bookPic.attr('src', img);
             $favorPic.attr('src', img);
             });
             }
             }); */
        }

        function searchCommunication ($, searchValue) {
            /*
             var data = {searchValue: searchValue, rowCount: 5};
             callMethods('FindUserCommunication', data, function(request, success, response){
             var responseObject = {};

             if (success) {
             responseObject = Terrasoft.decode(response.responseText);
             }
             }); */
        }
        window.searchCommunication = searchCommunication;

        function setAgentStatusClass ($, id, agent){
            $('#' + id).removeClass();
            $('#' + id).addClass(getAgentClassStatus(agent));
        }

        function setUserFavorites ($, number, container) {

            if (!container.parent().hasClass('t-favor__true')) {
                // add favourite
                container.parent().addClass('t-favor__true');
                var containerUsr = container.parent().parent();
                addFavorite(jQuery, containerUsr);
            }
            else {
                // remove favourite
                var id = container.parent().parent().attr('id').
                replace('favor-','').replace(CONTACT_PREF, '');
                $('#favor-webitel-agen-' + id).remove();
                $('#' + CONTACT_PREF + id).find('.t-box-btn-favor').removeClass('t-favor__true');
            }

            /*
             var data = {userId: Terrasoft.SysValue.CURRENT_USER_CONTACT.value, number: number};
             callMethods('SetUserFavorites', data, function(request, success, response){
             var responseObject = {};
             if (success) {
             responseObject = Terrasoft.decode(response.responseText);
             if (responseObject.SetUserFavoritesResult == 0) {
             //container.parent().removeClass('t-favor__true');
             var id = container.parent().parent().attr('id').
             replace('favor-','').replace(CONTACT_PREF, '');
             $('#favor-webitel-agen-' + id).remove();
             $('#' + CONTACT_PREF + id).find('.t-box-btn-favor').removeClass('t-favor__true');
             } else if (responseObject.SetUserFavoritesResult == 1) {
             container.parent().addClass('t-favor__true');
             var containerUsr = container.parent().parent();
             addFavorite(jQuery, containerUsr);
             }
             }
             });
             */
        }

        function addMenuFavourites ($, key) {
            // Initializing menuFavourites area
            var menuFavourites = $('<li>', {class: 't-favor t-longer_menu_item webitel-del-li'});

            /*----------------Fill in the menuFavouritesSubMenuContent--------------*/

            // Submenu Favourites Table
            var subMenuFavouritesTable = $('.t-favor').find('table'),
                subMenuFavouritesTableRowData = [
                    {class: 't-status'},
                    {class: 't-box-btn-favor t-favor__true', innerHtml: {tag: '<div>', attrs: {class: 't-btn-favor webitel-def-comp', click: function() {
                        var number = $(this).parent().parent().find('.t-usernum').text();
                        setUserFavorites($, number, $(this));
                    }}}},
                    {class: 't-userpic', innerHtml: {tag: '<img>', attrs: {width: '31px', height: '31px', innerValue: 'userpic'}}},
                    {class: 't-username', innerValue: 'username', innerHtml: {}},
                    {class: 't-usernum', innerValue: 'number', innerHtml: {}},
                    {class: 't-box-btn', innerHtml: {tag: '<a>', attrs: {class: 't-btn t-btn__call', click: function() {
                        var $this = $(this),
                            $parent = $this.parent(),
                            dialedNumber = $parent.parent().find('.t-usernum').text();
                        if(dialedNumber){
                            OnNewCall.trigger(dialedNumber);
                        };
                    }}}}
                ];

            // Fill in the table with table rows which equals to the FAVOURITES array length
            // We iterate through FAVOURITES
            // On every event separate tr is created
            var tableRowContent = $('<tr>', {id: 'favor-' + CONTACT_PREF + FAVOURITES[key]['number']});
            // Here we iterate through the row data to know how many td is needed
            for (var i in subMenuFavouritesTableRowData) {
                var innerHtml = subMenuFavouritesTableRowData[i].innerHtml,
                    innerValue = subMenuFavouritesTableRowData[i].innerValue;

                // Here we create inner html structure if neccessary
                if(innerHtml || innerValue){

                    // if we need to fill in data dynamically from the server to the innerHtml
                    if(innerHtml.attrs && innerHtml.attrs.innerValue){
                        var innerHtmlValue = innerHtml.attrs.innerValue;

                        for (var property in FAVOURITES[key][innerHtmlValue]){
                            innerHtml.attrs[property] = FAVOURITES[key][innerHtmlValue][property]
                        };
                    };

                    // Filling the table row with data
                    tableRowContent
                        .append($('<td>', {
                                class: subMenuFavouritesTableRowData[i].class,
                                text: FAVOURITES[key][innerValue]
                            })
                                .append($(innerHtml.tag, innerHtml.attrs))
                        )
                    // Removing helper innerValue from the DOM elements
                    if(tableRowContent.find('[innerValue]')[0]){
                        tableRowContent.find('[innerValue]')[0].removeAttribute('innerValue')
                    };
                } else {
                    // Filling the table row with data if there is no innerHtml structure
                    tableRowContent.append(
                        $('<td>', {class: subMenuFavouritesTableRowData[i].class})
                    )
                };
            };
            // append TableRow to the table
            subMenuFavouritesTable.append(tableRowContent.toggleClass(FAVOURITES[key].class))


            /*----------------End of the menuFavouritesSubMenuContent--------------*/

//        menuFavourites.append(menuFavouritesIcon);
//        menuFavourites.append(subMenuContent);
            return menuFavourites;
        };

        function initializeCurrentUser ($) {
            $('#webitel-current-user-img').attr('src', DEF_USER_PIC);
        }

        var getCallKeyFromCallId = function (callId) {
            for (var key in AlertMenuObjectsArray) {
                if (AlertMenuObjectsArray[key]['id'] == callId || AlertMenuObjectsArray[key]['webitelCallId'] == callId) {
                    return key;
                };
            };
        };

        // END IGOR

        /*-----------------WebitelPanelEvents-----------------------*/

        /*--------------Webitel Events Subscribers---------------*/
        var webitelEventsSubscribers = function ($) {
            webitel.onAddUser(function(agent) {
                var key = BOOK_LIST.push({
                    class: getAgentClassStatus(agent),
                    number: agent['id'],
                    username: agent['name'],
                    userpic: {src: DEF_USER_PIC}
                });
                addAcountBookList($, (key - 1));
                // showBookListInfo($);
            });

            webitel.onConnect(function(){
                webitel.login();
            });

            webitel.onReady(function() {
                WebitelPanelActions.setNumber($, webitel.account().id);
            });

            webitel.onUserStatusChange(function (agent){
                if (!INI_WEBITEL) { // Нужен фикс
                    loadUserFavorites($);
                    INI_WEBITEL = true;
                }
                var ssip_id = webitel.account().id + '@' + webitel.account().domain,
                    agent_ssip_id = agent.id + '@' + agent.domain;

                // IGOR
                setAgentStatusClass($, CONTACT_PREF + agent['id'], agent);
                setAgentStatusClass($, 'favor-' + CONTACT_PREF + agent['id'], agent);
                // ENDIGOR

                if(agent_ssip_id == ssip_id) {
                    if (agent.state == WebitelAccountStatusTypes.Busy && agent.away == WebitelUserAwayCauseTypes.None) {
                        WebitelPanelActions.setStatus($, (ENG_LNG) ? 'Call' : 'Занят');
                        return;
                    }

                    switch(agent.state){
                        case WebitelAccountStatusTypes.Ready:
                            WebitelPanelActions.setStatus($, WebitelPanelAccountStatusTypes.Ready);
                            break;
                        case WebitelAccountStatusTypes.Busy:
                            var status = WebitelPanelAccountStatusTypes.Busy;
                            switch (agent.away) {
                                case WebitelUserAwayCauseTypes.CallForwarding:
                                    status = WebitelPanelAccountAwayCauseTypes.CallForwarding;
                                    break;
                                case WebitelUserAwayCauseTypes.VoiceMail:
                                    status = WebitelPanelAccountAwayCauseTypes.VoiceMail;
                                    break;
                                case WebitelUserAwayCauseTypes.DoNotDisturb:
                                    status = WebitelPanelAccountAwayCauseTypes.DoNotDisturb;
                                    break
                            }
                            WebitelPanelActions.setStatus($, status);
                            break;
                    }
                }
            });

            webitel.onNewCall(function (newCall) {
                if(newCall['direction'] == 'outbound' || newCall['direction'] == 'callback') {
                    var newCallInfo = {
                        class: 't-status__07 t-recent_arrow__up',
                        id: newCall['uuid'].replace('.',''),
                        webitelCallId: newCall['uuid'],
                        time: '00 : 00 : 00',
                        number: newCall['displayNumber'],
                        username: newCall['calleeName'],
                        userpic: {src: DEF_USER_PIC},
                        //  timer: new Timer(),
                        callDirectionClass: 't-btn t-btn__pause',
                        callStatus: 'NewCall'
                    };
                } else {
                    var newCallInfo = {
                        class: 't-status__07 t-recent_arrow__down',
                        id: newCall['uuid'].replace('.',''),
                        time: '00 : 00 : 00',
                        number: newCall['displayNumber'],
                        username: newCall['callerName'],
                        webitelCallId: newCall['uuid'],
                        userpic: {src: DEF_USER_PIC},
                        // timer: new Timer(),
                        callDirectionClass: 't-btn t-btn__call',
                        callStatus: 'NewCall'
                    };
                };
                newCallInfo.sourceCall = newCall;
                newCallInfo.holdState = WebitelPanelHoldState.UnHold;

                var newKey = AlertMenuObjectsArray.push(newCallInfo);
                WebitelPanelActions.showCallInfo($, (newKey - 1));
                getAccountSelectTest($, newCall['call-display-number'], newCall['uuid']);
            });

            function createIncomingMediaElement (id, onFullscreanEvent) {
                var mediaTag = document.getElementById(id);
                if (mediaTag) {
                    return mediaTag;
                };
                var parent = document.getElementById('IncomingVideo-div');
                var div = document.createElement('div');
                div.id = id + '-wrap';

                var incomingMediaTag = document.createElement('video');
                incomingMediaTag.className = 'IncomingVideo';

                var controls = document.createElement('tr');
                controls.className = 't-video-controls t-video-controls-full__off';
                var btnFullScr = document.createElement('th');
                btnFullScr.className = 't-video-controls-btn-full';
                btnFullScr.onclick = function() {
                    var dom = this.parentElement.parentElement;
                    onFullscreanEvent.trigger(dom);
                };

                controls.appendChild(btnFullScr);

                div.appendChild(controls);
                incomingMediaTag.id = 'video-' + id;
                div.appendChild(incomingMediaTag);
                parent.appendChild(div);
                return incomingMediaTag;
            };

            webitel.onNewWebRTCCall(function (session) {
                var _tag = createIncomingMediaElement(session.callID);
                session.params.tag = _tag.id;
            });

            webitel.onDestroyWebRTCCall(function (session) {
                var incomingMediaTag = document.getElementById('video-' + session.callID);
                if (incomingMediaTag) {
                    var incomingMediaTagWrap = (document.getElementById(session.callID + '-wrap'));

                    incomingMediaTag.pause();
                    incomingMediaTag.src = '';
                    incomingMediaTag.load();

                    incomingMediaTag.remove();
                    incomingMediaTagWrap.remove();
                }
            });

            webitel.onAcceptCall(function (call) {
                WebitelPanelActions.answeredCall($, call);
                var useVideo = VideoControl.status();
                if (useVideo) {
                    VideoControl.show();
                };
                for (var key in AlertMenuObjectsArray) {
                    if (AlertMenuObjectsArray[key].id !== call['uuid'] && AlertMenuObjectsArray[key].holdState === WebitelPanelHoldState.UnHold) {
                        OnHoldCall.trigger(AlertMenuObjectsArray[key].webitelCallId);
                    }
                }
            });

            webitel.onHangupCall(function (removeCall) {
                if (!~['NORMAL_CLEARING', 'ORIGINATOR_CANCEL'].indexOf(removeCall.hangup_cause)) {
                    notifier.error("CTI: hangup cause - " + removeCall.hangup_cause, null, 5000)
                }
                WebitelPanelActions.hangUpCall($, removeCall['uuid']);
                if (AlertMenuObjectsArray.length == 0) {
                    VideoControl.hide();
                }
            });

            webitel.onHoldCall(function(call) {
                WebitelPanelActions.holdCall($, call['uuid']);
            });

            webitel.onUnholdCall(function(call) {
                WebitelPanelActions.unholdCall($, call['uuid']);
                for (var key in AlertMenuObjectsArray) {
                    if (AlertMenuObjectsArray[key].id !== call['uuid'] && AlertMenuObjectsArray[key].holdState === WebitelPanelHoldState.UnHold) {
                        OnHoldCall.trigger(AlertMenuObjectsArray[key].webitelCallId);
                    }
                }
            });

        };
        /*--------------Webitel Events Subscribers---------------*/

        var loadWebitelFromInstance = function (instance) {
            WebitelPanelActions.setNumber($, instance.account().id);
            instance.getAgentsList(function(users) {
                var agent;
                for (var i in users) {
                    agent = users[i];
                    var key = BOOK_LIST.push({
                        class: getAgentClassStatus(agent),
                        number: agent['id'],
                        username: agent['name'],
                        userpic: {src: DEF_USER_PIC}
                    });
                    addAcountBookList($, (key - 1));

                }
                // TODO
                WebitelPanelActions.setStatus($, instance.account().state === WebitelAccountStatusTypes.Ready
                    ? WebitelPanelAccountStatusTypes.Ready
                    : WebitelPanelAccountStatusTypes.Busy);
            })
        };

        var initializeWebitelConnection = function (){
            var webrtcConnect;

            if (!configuration['webrtc_server']) {
                webrtcConnect = false;
            } else {
                webrtcConnect = {
                    ws_servers: configuration['webrtc_server'],
                    login: configuration['user'],
                    password: configuration['password']
                }
            }

            if (configuration['instance']) {
                webitel = configuration['instance'];
                loadWebitelFromInstance(webitel)
            } else {
                webitel = Webitel({
                    server: configuration['server_address'],
                    account: configuration['user'],
                    secret: configuration['password'],
                    reconnect: 5,
                    debug: true,
                    webrtc: webrtcConnect,
                    domain: configuration['domain']
                });
            }

            IS_WEBRTC = (configuration['webrtc_server'] != null && configuration['webrtc_server'] != undefined && configuration['webrtc_server'] != '') || configuration["_is_webrtc"];
        };

        // Initialize UI WebitelPanel
        var initializePanel = function () {
            /* initialize panel */
            initializePanelView(jQuery);
            /* initialize events */
            UIEvents(jQuery);
            /* WebitelPanelEventSubscribers */
            webitelPanelEventsSubscribers(jQuery);
            /* We need to establish connection and then to set webitelSubscribers */
            initializeWebitelConnection(jQuery);
            webitelEventsSubscribers(jQuery);
            if (!configuration['instance'])
                webitel.connect();
            initializeCurrentUser(jQuery);
        };

        initializePanel();

        return {
            onStatusChange: OnStatusChange,
            onNewCall: OnNewCall,
            onHangUpCall: OnHangUpCall,
            onCallForwarding: OnCallForwarding,
            onHoldCall: OnHoldCall,
            onRetrieveCall: OnRetrieveCall,
            onSettingsChange: OnSettingsChange,
            onUseVideoChange: OnUseVideoChange
        };
    };
});

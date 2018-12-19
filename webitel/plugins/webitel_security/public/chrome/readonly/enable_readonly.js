import chrome from 'ui/chrome';
import { uiModules } from 'ui/modules';
import { Notifier } from 'ui/notify/notifier';

// Needed to access the dashboardProvider
import 'plugins/kibana/dashboard/dashboard_config';

/**
 * We only want to show the read only message once per page load
 * @type {boolean}
 */
let readOnlyMessageAlreadyShown = false;

// As of today, the dashboardConfigProvider doesn't provide a setter
// with which we can change the state after Angular's config phase.
// Hence, we extend it with our own method.
uiModules.get('kibana').config((dashboardConfigProvider) => {

    let providerGetter = dashboardConfigProvider.$get();

    // This method will be added to the providers $get function (standard Angular provider)
    providerGetter.setHideWriteControls = function(){
        this.turnHideWriteControlsOn()
    }.bind(dashboardConfigProvider);

    window.TEST = providerGetter;

    // Makes the setter available in the original provider
    dashboardConfigProvider.$get = function() {
        return providerGetter;
    };
});


/**
 * Holds the original state of the navigation links "hidden" property
 * @type {null|Object}
 */
let originalNavItemsVisibility = null;

/**
 * If at least one readonly role is configured, we start by hiding
 * the navigation links until we have resolved the the readonly
 * status of the current user
 */
function hideNavItems() {
    originalNavItemsVisibility = {};
    chrome.getNavLinks().forEach((navLink) => {
        if (navLink.id !== 'kibana:dashboard') {

            originalNavItemsVisibility[navLink.id] = navLink.hidden;
            navLink.hidden = true;

            // This is a bit of a hack to make sure that we detect
            // changes that happen between reading the original
            // state and resolving our info
            navLink._sgHidden = navLink.hidden;
            Object.defineProperty(navLink, 'hidden', {
                set(value) {
                    originalNavItemsVisibility[this.id] = value;
                    this._sgHidden = value;
                },
                get() {
                    return this._sgHidden;
                }
            });
        }
    });
}
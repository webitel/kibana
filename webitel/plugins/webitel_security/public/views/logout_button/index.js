import {constant} from 'lodash';
import {chromeNavControlsRegistry} from 'ui/registry/chrome_nav_controls';
import template from 'plugins/webitel_security/views/logout_button/logout_button.html';

chromeNavControlsRegistry.register(constant({
  name: 'logoutButton',
  order: 1000,
  template
}));
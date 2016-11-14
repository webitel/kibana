import {constant} from 'lodash';
import registry from 'ui/registry/chrome_nav_controls';
import template from 'plugins/security/views/logout_button/logout_button.html';

registry.register(constant({
  name: 'logoutButton',
  order: 1000,
  template
}));
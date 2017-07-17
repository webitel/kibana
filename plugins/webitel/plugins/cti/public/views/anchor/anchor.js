/**
 * Created by igor on 14.11.16.
 */

"use strict";

import {constant} from 'lodash';
import {chromeNavControlsRegistry} from 'ui/registry/chrome_nav_controls';
import template from 'plugins/cti/views/anchor/anchor.html';

chromeNavControlsRegistry.register(constant({
    name: 'ctiPanel',
    order: 1000,
    template
}));
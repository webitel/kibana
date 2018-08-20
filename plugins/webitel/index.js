/**
 * Created by igor on 04.11.16.
 */

"use strict";

import { webitelMain } from './plugins/webitel_main';
import security from './plugins/security';
import accounts from './plugins/accounts';
import agents from './plugins/agents';
import agentsMonitor from './plugins/agents_monitor';
import calls from './plugins/calls';
import members from './plugins/members';
import exports from './plugins/exports';
import recordings from './plugins/recordings';
import reporting from './plugins/reporting';
import cti from './plugins/cti';

module.exports = kibana => [
  webitelMain(kibana),
  security(kibana),
  accounts(kibana),
  agents(kibana),
  agentsMonitor(kibana),
  agents(kibana),
  calls(kibana),
  members(kibana),
  exports(kibana),
  recordings(kibana),
  reporting(kibana),
  cti(kibana),
];

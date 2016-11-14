/**
 * Created by igor on 04.11.16.
 */

"use strict";

import main from './plugins/main';
import security from './plugins/security';
import accounts from './plugins/accounts';
import calls from './plugins/calls';
import agents from './plugins/agents';
import members from './plugins/members';
import exports from './plugins/exports';
import recordings from './plugins/recordings';
import cti from './plugins/cti';

module.exports = kibana => [
    main(kibana),
    security(kibana),
    accounts(kibana),
    calls(kibana),
    agents(kibana),
    members(kibana),
    exports(kibana),
    recordings(kibana),
    cti(kibana)
];
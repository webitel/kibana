import { webitel_main } from './plugins/webitel_main'
import { webitel_security } from './plugins/webitel_security'
import { webitel_reporting } from './plugins/webitel_reporting'
import { accounts } from './plugins/accounts'
import { agents } from './plugins/agents'
import { agents_monitor } from './plugins/agents_monitor'
import { members } from './plugins/members'
import { recordings } from './plugins/recordings'
import { exports } from './plugins/exports'
import { calls } from './plugins/calls'

module.exports = function (kibana) {
    return [
        webitel_main(kibana),
        webitel_security(kibana),
        webitel_reporting(kibana),
        accounts(kibana),
        agents(kibana),
        agents_monitor(kibana),
        members(kibana),
        recordings(kibana),
        exports(kibana),
        calls(kibana),
    ]
};
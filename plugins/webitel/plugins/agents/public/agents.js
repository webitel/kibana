/**
 * Created by i.navrotskyj on 11.11.2015.
 */


import 'plugins/agents/agents_vis.css';
import 'plugins/agents/agents_controller';

import visTemplate from 'plugins/agents/agents_vis.html';
import visParamTemplate from 'plugins/agents/agents_vis_params.html';

import TemplateVisTypeTemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';


require('ui/registry/vis_types').register(AgentsListProvider);

function AgentsListProvider(Private) {
    var TemplateVisType = Private(TemplateVisTypeTemplateVisTypeProvider);
    return new TemplateVisType({
        name: 'WebitelAgentsStatus',
        title: "Member counts",
        icon: 'fa-crosshairs',
        description: 'Member count in the queue.',
        template: visTemplate,
        params: {
            editor: visParamTemplate
        },
        requiresSearch: false
    });
}

export default AgentsListProvider;
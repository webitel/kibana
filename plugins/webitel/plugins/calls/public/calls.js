import 'plugins/calls/calls_vis.css';
import 'plugins/calls/calls_controller';

import TemplateVisTypeTemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';

import visTemplate from 'plugins/calls/calls_vis.html';
import visParamTemplate from 'plugins/calls/calls_vis_params.html';

// register the provider with the visTypes registry
require('ui/registry/vis_types').register(CallsProvider);

function CallsProvider(Private) {
    var TemplateVisType = Private(TemplateVisTypeTemplateVisTypeProvider);
    return new TemplateVisType({
        name: 'WebitelCallStatus',
        title: "Calls monitor",
        icon: 'fa-phone',
        description: 'Shows Real-Time call sessions detailed information.',
        template: visTemplate,
        params: {
            editor: visParamTemplate
        },
        requiresSearch: false
    });
}

export default CallsProvider;
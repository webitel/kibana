import 'plugins/calls/calls_vis.css';
import 'plugins/calls/calls_controller';

import { TemplateVisTypeProvider } from 'ui/template_vis_type/template_vis_type';

import visTemplate from 'plugins/calls/calls_vis.html';
import visParamTemplate from 'plugins/calls/calls_vis_params.html';
import {VisVisTypeProvider} from 'ui/vis/vis_type';
import { VisTypesRegistryProvider } from 'ui/registry/vis_types';

// register the provider with the visTypes registry
VisTypesRegistryProvider.register(CallsProvider);

function CallsProvider(Private) {
    var TemplateVisType = Private(TemplateVisTypeProvider);
    const VisType = Private(VisVisTypeProvider);
    
    return new TemplateVisType({
        name: 'WebitelCallStatus',
        title: "Calls monitor",
        icon: 'fa-phone',
        category: VisType.CATEGORY.ONLINE,
        description: 'Shows Real-Time call sessions detailed information.',
        template: visTemplate,
        params: {
            editor: visParamTemplate
        },
        requiresSearch: false
    });
}

export default CallsProvider;
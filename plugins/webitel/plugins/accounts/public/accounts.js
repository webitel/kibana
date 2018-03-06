import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { VisFactoryProvider } from 'ui/vis/vis_factory';
import { CATEGORY } from 'ui/vis/vis_category';

import 'plugins/accounts/accounts_vis.css';
import 'plugins/accounts/accounts_controller';
import visTemplate from 'plugins/accounts/accounts_vis.html';
import visParamTemplate from 'plugins/accounts/accounts_vis_params.html';


// register the provider with the visTypes registry
VisTypesRegistryProvider.register(function AccountProvider(Private) {
    const VisFactory = Private(VisFactoryProvider);

    return VisFactory.createAngularVisualization({
        name: 'WebitelAccountStatus',
        title: "Users monitor",
        icon: 'fa-users',
        category: CATEGORY.OTHER,
        description: 'Gives you access to the real-time users information such as status, state or endpoint registrations.',
        visConfig: {
            template: visTemplate,
        },
        editorConfig: {
            optionsTemplate: visParamTemplate
        },
        requiresSearch: false,
        requestHandler: 'none',
        responseHandler: 'none',
        options: {
            showIndexSelection: false
        }
    })
});

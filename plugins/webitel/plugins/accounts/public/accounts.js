import 'plugins/accounts/accounts_vis.css';
import 'plugins/accounts/accounts_controller';

import visTemplate from 'plugins/accounts/accounts_vis.html';
import visParamTemplate from 'plugins/accounts/accounts_vis_params.html';
import VisVisTypeProvider from 'ui/vis/vis_type';

import TemplateVisTypeTemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';

// register the provider with the visTypes registry
require('ui/registry/vis_types').register(AccountProvider);

function AccountProvider(Private) {
    var TemplateVisType = Private(TemplateVisTypeTemplateVisTypeProvider);
    const VisType = Private(VisVisTypeProvider);

    return new TemplateVisType({
        name: 'WebitelAccountStatus',
        title: "Users monitor",
        icon: 'fa-users',
        category: VisType.CATEGORY.ONLINE,
        description: 'Gives you access to the real-time users information such as status, state or endpoint registrations.',
        template: visTemplate,
        params: {
            editor: visParamTemplate
        },
        requiresSearch: false
    });
}

export default AccountProvider;
/**
 * Created by i.navrotskyj on 11.11.2015.
 */

import 'plugins/members/members_vis.css';
import 'plugins/members/members_controller';

import TemplateVisTypeTemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';

import visTemplate from 'plugins/members/members_vis.html';
import visParamTemplate from 'plugins/members/members_vis_params.html';

// register the provider with the visTypes registry
require('ui/registry/vis_types').register(MembersListProvider);

function MembersListProvider(Private) {
    var TemplateVisType = Private(TemplateVisTypeTemplateVisTypeProvider);
    return new TemplateVisType({
        name: 'WebitelMembersList',
        title: "Member list",
        icon: 'fa-phone-square',
        description: 'List callers present in the queues.',
        template: visTemplate,
        params: {
            editor: visParamTemplate
        },
        requiresSearch: false
    });
}

export default MembersListProvider;
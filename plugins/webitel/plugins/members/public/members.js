/**
 * Created by i.navrotskyj on 11.11.2015.
 */

import 'plugins/members/members_vis.css';
import 'plugins/members/members_controller';

import { TemplateVisTypeProvider } from 'ui/template_vis_type/template_vis_type';

import visTemplate from 'plugins/members/members_vis.html';
import visParamTemplate from 'plugins/members/members_vis_params.html';
import {VisVisTypeProvider} from 'ui/vis/vis_type';
import { VisTypesRegistryProvider } from 'ui/registry/vis_types';

// register the provider with the visTypes registry
VisTypesRegistryProvider.register(MembersListProvider);

function MembersListProvider(Private) {
    var TemplateVisType = Private(TemplateVisTypeProvider);
    const VisType = Private(VisVisTypeProvider);

    return new TemplateVisType({
        name: 'WebitelMembersList',
        title: "Member list",
        icon: 'fa-phone-square',
        description: 'List callers present in the queues.',
        category: VisType.CATEGORY.ONLINE,
        template: visTemplate,
        params: {
            editor: visParamTemplate
        },
        requiresSearch: false
    });
}

export default MembersListProvider;
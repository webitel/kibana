/**
 * Created by i.navrotskyj on 11.11.2015.
 */

require('plugins/webitel/members/members_vis.css');
require('plugins/webitel/members/members_controller');

require('plugins/webitel/lib/webitel');

// register the provider with the visTypes registry
require('ui/registry/vis_types').register(MembersListProvider);

function MembersListProvider(Private) {
    var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));
    return new TemplateVisType({
        name: 'WebitelMembersList',
        title: "Member list",
        icon: 'fa-phone-square',
        description: 'List callers present in the queues.',
        template: require('plugins/webitel/members/members_vis.html'),
        params: {
            editor: require('plugins/webitel/members/members_vis_params.html')
        },
        requiresSearch: false
    });
}
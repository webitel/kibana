/**
 * Created by i.navrotskyj on 11.11.2015.
 */


define(function (require) {
    // we need to load the css ourselves
    require('plugins/webitel/agents/agents_vis.css');
    require('plugins/webitel/agents/agents_controller');

    require('plugins/webitel/lib/webitel');

    // register the provider with the visTypes registry
    require('ui/registry/vis_types').register(AgentsListProvider);

    function AgentsListProvider(Private) {
        var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));
        return new TemplateVisType({
            name: 'WebitelAgentsStatus',
            title: "Member counts",
            icon: 'fa-crosshairs',
            description: 'Member count in the queue.',
            template: require('plugins/webitel/agents/agents_vis.html'),
            params: {
                editor: require('plugins/webitel/agents/agents_vis_params.html')
            },
            requiresSearch: false
        });
    }

    return AgentsListProvider;
});
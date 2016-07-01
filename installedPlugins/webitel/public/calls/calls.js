require('plugins/webitel/calls/calls_vis.css');
require('plugins/webitel/calls/calls_controller');

require('plugins/webitel/lib/webitel');

// register the provider with the visTypes registry
require('ui/registry/vis_types').register(CallsProvider);

function CallsProvider(Private) {
    var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));
    return new TemplateVisType({
        name: 'WebitelCallStatus',
        title: "Calls monitor",
        icon: 'fa-phone',
        description: 'Shows Real-Time call sessions detailed information.',
        template: require('plugins/webitel/calls/calls_vis.html'),
        params: {
            editor: require('plugins/webitel/calls/calls_vis_params.html')
        },
        requiresSearch: false
    });
}
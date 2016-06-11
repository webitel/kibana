/**
 * Created by i.navrotskyj on 06.10.2015.
 */


define(function (require) {
    // we need to load the css ourselves
    require('plugins/webitel/iframe/iframe_vis.css');
    require('plugins/webitel/iframe/iframe_controller');

    // register the provider with the visTypes registry
    require('ui/registry/vis_types').register(IFrameProvider);

    function IFrameProvider(Private) {
        var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));
        return new TemplateVisType({
            name: 'IFrame',
            title: 'Frame',
            icon: 'fa-external-link',
            description: 'An inline frame is used to embed another document within the current HTML document.',
            template: require('plugins/webitel/iframe/iframe_vis.html'),
            params: {
                editor: require('plugins/webitel/iframe/iframe_vis_params.html')
            },
            requiresSearch: false
        });
    }

    return IFrameProvider;
});
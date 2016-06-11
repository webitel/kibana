define(function (require) {
    // we need to load the css ourselves
    require('plugins/webitel/accounts/accounts_vis.css');
    require('plugins/webitel/accounts/accounts_controller');

    require('plugins/webitel/lib/webitel');

    // register the provider with the visTypes registry
    require('ui/registry/vis_types').register(AccountProvider);

    function AccountProvider(Private) {
        var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));
        return new TemplateVisType({
            name: 'WebitelAccountStatus',
            title: "Users monitor",
            icon: 'fa-users',
            description: 'Gives you access to the real-time users information such as status, state or endpoint registrations.',
            template: require('plugins/webitel/accounts/accounts_vis.html'),
            params: {
                editor: require('plugins/webitel/accounts/accounts_vis_params.html')
            },
            requiresSearch: false
        });
    }

    return AccountProvider;
});
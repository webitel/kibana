
import {
    FeatureCatalogueCategory,
    FeatureCatalogueRegistryProvider,
    // @ts-ignore
} from 'ui/registry/feature_catalogue';



FeatureCatalogueRegistryProvider.register(() => {
    return {
        id: 'webitel_security',
        title: 'Security spaces',
        description: 'Organize your space access control list.',
        icon: 'securityApp',
        path: '/app/kibana#/management/security_spaces/list',
        showOnHomePage: true,
        category: FeatureCatalogueCategory.ADMIN,
    };
});

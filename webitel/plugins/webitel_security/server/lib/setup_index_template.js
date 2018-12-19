import { get } from 'lodash'

export default function (plugin, server) {

    const callAdminAsKibanaUser = server.plugins.elasticsearch.getCluster('admin').callWithInternalUser;
    const index = server.config().get('kibana.index');

    function waitForElasticsearchGreen() {
        return new Promise((resolve) => {
            server.plugins.elasticsearch.status.once('green', resolve);
        });
    }

    async function setupIndexTemplate() {
        const adminCluster = server.plugins.elasticsearch.getCluster('admin');

        const aclMappingTemplate = () => ({
            "type": "object",
            "properties": {
                "c": {type: 'keyword'},
                "r": {type: 'keyword'},
                "u": {type: 'keyword'},
                "d": {type: 'keyword'}
            }
        });

        const mappings = server.getKibanaIndexMappingsDsl();
        if (get(mappings, 'doc.properties.space.properties')) {
            mappings.doc.properties.space.properties.createdOn = {
                type: 'date'
            };
            mappings.doc.properties.space.properties.createdBy = {
                type: 'keyword'
            };
            mappings.doc.properties.space.properties.modifyOn = {
                type: 'date'
            };
            mappings.doc.properties.space.properties.modifyBy = {
                type: 'keyword'
            };
            mappings.doc.properties.space.properties.acl = {
                "type": "object",
                "properties": {
                    "config": aclMappingTemplate(),
                    "index-pattern": aclMappingTemplate(),
                    "search": aclMappingTemplate(),
                    "dashboard": aclMappingTemplate(),
                    "visualization": aclMappingTemplate(),
                    "canvas-workpad": aclMappingTemplate(),
                }
            }
        }

        try {
            await callAdminAsKibanaUser('indices.putTemplate', {
                name: `kibana_index_template:${index}-*`,
                body: {
                    template: index+"-*",
                    settings: {
                        number_of_shards: 1,
                    },
                    mappings
                },
            });
        } catch (error) {
            server.log(['debug', 'setupIndexTemplate'], {
                tmpl: 'Error setting up indexTemplate for SavedObjects: <%= err.message %>',
                es: {
                    resp: error.body,
                    status: error.status,
                },
                err: {
                    message: error.message,
                    stack: error.stack,
                },
            });
            throw new adminCluster.errors.ServiceUnavailable();
        }
    }

    return {
        setupIndexTemplate: setupIndexTemplate,
        waitForElasticsearchGreen: waitForElasticsearchGreen
    };

}

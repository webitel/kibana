/**
 * Created by igor on 10.11.16.
 */

"use strict";

import docViewsRegistry from 'ui/registry/doc_views';

require('plugins/recordings/doc_views/recordings_tab.css');
const template = require('plugins/recordings/doc_views/recordings_tab.html');
const module = require('ui/modules').get('kibana/webitel/recordings');


module.service('webitelRecords', ($http, $q) => {
    const deferred = $q.defer();
    let session = null;
    $http.get('../api/webitel/v1/whoami')
        .then( res => {
            session = res.data.credentials;

            deferred.resolve({
                getRecordUri: (id, name, fileName, type, hash) => {
                    let uri = `../api/webitel/v1/recordings/${id}?`;
                    if (name) {
                        uri += `name=${name}`;
                        if (fileName && type) {
                            uri += `&file_name=${fileName}_${name}.${type}`;
                        }
                    }

                    if (hash)
                        uri += `&hash=${hash}`;
                    return uri;
                }
            })
        });

    return deferred.promise;
});

docViewsRegistry.register(function () {
    return {
        title: 'Recordings',
        order: 30,
        shouldShow: data => {
            return data && data._source.recordings && data._source.recordings.length > 0;
        },
        directive: {
            template: template,
            scope: {
                hit: '='
            },
            controller: function ($scope, $sce, webitelRecords) {
                $scope.recordings = $scope.hit._source.recordings;

                if (!$scope.recordings) {
                    return
                }

                webitelRecords.then(api => {

                    $scope.download = function (source) {
                        var $a = document.createElement('a');
                        $a.href = api.getRecordUri(source.uuid, source.name, source.createdOn, _getTypeFile(source['content-type']), source.hash);
                        $a.download = source.name;
                        document.body.appendChild($a);
                        $a.click();
                        document.body.removeChild($a);
                    };

                    $scope.recordings.forEach( source => {
                        source.__src =  $sce.trustAsResourceUrl(
                            api.getRecordUri(source.uuid, source.name, source.createdOn, _getTypeFile(source['content-type']), source.hash)
                        );
                        source.__type = source['content-type'];
                    });
                });
            }
        }
    };
});

function _getTypeFile(contentType) {

    switch (contentType) {
        case 'application/pdf':
            return 'pdf';
        case 'audio/wav':
            return 'wav';
        case 'audio/mpeg':
        default:
            return 'mp3'

    }
}
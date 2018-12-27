import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { VisFactoryProvider } from 'ui/vis/vis_factory';
import { CATEGORY } from 'ui/vis/vis_category';

import 'plugins/calls/calls_vis.css';
import 'plugins/calls/calls_controller';
import visTemplate from 'plugins/calls/calls_vis.html';
import visParamTemplate from 'plugins/calls/calls_vis_params.html';
import image from './calls_icon.svg'

import config from './config'

VisTypesRegistryProvider.register(function CallsProvider(Private) {
  const VisFactory = Private(VisFactoryProvider);

  return VisFactory.createAngularVisualization({
    name: 'WebitelCallStatus',
    title: "Calls monitor",
    image,
    category: CATEGORY.OTHER,
    description: 'Shows Real-Time call sessions detailed information.',
    visConfig: {
      template: visTemplate,
      defaults: transformConfig(config),
    },
    editorConfig: {
      optionsTemplate: visParamTemplate
    },
    requiresSearch: false,
    requestHandler: 'none',
    responseHandler: 'none',
    options: {
      showIndexSelection: false
    }
  })
});

function transformConfig(config) {

    const columns = {};

    angular.forEach(config.columns, (item) => {
        columns[item.field] = item;
    });

    return {
        domain: null,
        columns
    };
}
import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { VisFactoryProvider } from 'ui/vis/vis_factory';
import { CATEGORY } from 'ui/vis/vis_category';

import 'plugins/calls/calls_vis.css';
import 'plugins/calls/calls_controller';
import visTemplate from 'plugins/calls/calls_vis.html';
import visParamTemplate from 'plugins/calls/calls_vis_params.html';

VisTypesRegistryProvider.register(function CallsProvider(Private) {
  const VisFactory = Private(VisFactoryProvider);

  return VisFactory.createAngularVisualization({
    name: 'WebitelCallStatus',
    title: "Calls monitor",
    icon: 'fa-phone',
    category: CATEGORY.OTHER,
    description: 'Shows Real-Time call sessions detailed information.',
    visConfig: {
      template: visTemplate,
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

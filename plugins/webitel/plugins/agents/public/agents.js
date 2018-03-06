/**
 * Created by i.navrotskyj on 11.11.2015.
 */

import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { VisFactoryProvider } from 'ui/vis/vis_factory';
import { CATEGORY } from 'ui/vis/vis_category';

import 'plugins/agents/agents_vis.css';
import 'plugins/agents/agents_controller';
import visTemplate from 'plugins/agents/agents_vis.html';
import visParamTemplate from 'plugins/agents/agents_vis_params.html';

VisTypesRegistryProvider.register(function AgentsListProvider(Private) {
  const VisFactory = Private(VisFactoryProvider);

  return VisFactory.createAngularVisualization({
    name: 'WebitelAgentsStatus',
    title: "Member counts",
    icon: 'fa-crosshairs',
    category: CATEGORY.OTHER,
    description: 'Gives you access to the real-time users information such as status, state or endpoint registrations.',
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

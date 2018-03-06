/**
 * Created by i.navrotskyj on 11.11.2015.
 */

import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { VisFactoryProvider } from 'ui/vis/vis_factory';
import { CATEGORY } from 'ui/vis/vis_category';

import 'plugins/members/members_vis.css';
import 'plugins/members/members_controller';
import visTemplate from 'plugins/members/members_vis.html';
import visParamTemplate from 'plugins/members/members_vis_params.html';


// register the provider with the visTypes registry
VisTypesRegistryProvider.register(function MembersListProvider(Private) {
  const VisFactory = Private(VisFactoryProvider);

  return VisFactory.createAngularVisualization({
    name: 'WebitelMembersList',
    title: "Member list",
    icon: 'fa-phone-square',
    description: 'List callers present in the queues.',
    category: CATEGORY.OTHER,
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

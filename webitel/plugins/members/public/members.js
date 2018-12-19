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

import image from './members_icon.svg'

import config from './config'

// register the provider with the visTypes registry
VisTypesRegistryProvider.register(function MembersListProvider(Private) {
  const VisFactory = Private(VisFactoryProvider);

  return VisFactory.createAngularVisualization({
    name: 'WebitelMembersList',
    title: "Member list",
    image,
    description: 'List callers present in the queues.',
    category: CATEGORY.OTHER,
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
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import {NavBarExtensionsRegistryProvider} from 'ui/registry/navbar_extensions';
import { VisualizeConstants } from 'plugins/kibana/visualize/visualize_constants';
import { uiModules } from 'ui/modules';
import { stateMonitorFactory } from 'ui/state_management/state_monitor_factory';
import { openFlyout } from 'ui/flyout';

import { JobManager } from "../lib/job_manager";
import { ReportViewComponent } from './visualize/index'
import {getJobVisState} from "../lib/get_request";

function visualizeReportProvider(savedVisualizations, Private, $location, $route, $http, chrome) {
    return {
        appName: 'visualize',
        key: 'reporting-webitel-visualize',
        label: 'Reporting',
        description: 'Visualization Report',
        hideButton: () => {
            const { savedVis } = $route.current.locals;

            const prepare =  $location.path() === VisualizeConstants.LANDING_PAGE_PATH
                || $location.path() === VisualizeConstants.WIZARD_STEP_1_PAGE_PATH
                || $location.path() === VisualizeConstants.WIZARD_STEP_2_PAGE_PATH;

            if (prepare || !savedVis || !savedVis.id || savedVis.vis.type.type !== 'table') {
                return true;
            }
            const baseSave = savedVis.save;
            $route.current.locals.savedVis.save = async function (...args) {
                const result = await baseSave(...args);
                const jobManager = new JobManager($http, chrome);
                await saveJobVis(savedVis, jobManager);
                return result;
            };

            return false;
        },
        disableButton: () => false,
        run(menuItem, nav, target) {
            const jobManager = new JobManager($http, chrome);
            return openFlyout(<ReportViewComponent jobManager={jobManager} vis={$route.current.locals.savedVis}/>, {
                'data-test-subj': 'reportingPanel',
                closeButtonAriaLabel: 'Close Reporting',
            });
        },
        tooltip: () => ''
    };
}

async function saveJobVis(savedVis, jobManager) {
    const jobs = await jobManager.getJobs();

    const updateJobs = jobs.filter(j => {
        if (j.vis.length) {
            for (let v of j.vis) {
                if (v.id === savedVis.id) {
                    return true
                }
            }
        }
    });

    const updateRequest = await updateJobs.map( async j => {
        return await getJobRequest(j, savedVis)
    });

    for (let job of await Promise.all(updateRequest)) {
        jobManager.updateVisualizations(job.id, job.vis);
    }
}

async function getJobRequest (j, savedVis) {
    j.vis = j.vis.filter( j => j.id !== savedVis.id );
    j.vis.push(await getJobVisState(savedVis));
    return {
        id: j.id,
        vis: j.vis
    }
}

NavBarExtensionsRegistryProvider.register(visualizeReportProvider);
/**
 * Created by igor on 08.11.16.
 */

"use strict";

require('plugins/exports/directives/export_data_config');
const navbarExtensions = require('ui/registry/navbar_extensions');

function discoverExportProvider() {
    return {
        appName: "discover",
        key: "export-discover",
        label: "Export",
        description: "Export data",

        template: `<export-data-config object-type="Search"></export-data-config>`
    }
}

navbarExtensions.register(discoverExportProvider);
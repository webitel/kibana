require.config({
  baseUrl: './',
  paths: {
    kibana: 'index',
    // special utils
    routes: 'utils/routes/index',
    errors: 'components/errors',
    modules: 'utils/modules',
    lodash: 'utils/_mixins',

    // bower_components
    'angular-bindonce': 'bower_components/angular-bindonce/bindonce',
    'angular-bootstrap': 'bower_components/angular-bootstrap/ui-bootstrap-tpls',
    'angular-elastic': 'bower_components/angular-elastic/elastic',
    'angular-route': 'bower_components/angular-route/angular-route',
    'angular-ui-ace': 'bower_components/angular-ui-ace/ui-ace',
    ace: 'bower_components/ace-builds/src-noconflict/ace',
    'ace-json': 'bower_components/ace-builds/src-noconflict/mode-json',
    angular: 'bower_components/angular/angular',
    async: 'bower_components/async/lib/async',
    bower_components: 'bower_components',
    css: 'bower_components/require-css/css',
    d3: 'bower_components/d3/d3',
    elasticsearch: 'bower_components/elasticsearch/elasticsearch.angular',
    faker: 'bower_components/Faker/faker',
    file_saver: 'bower_components/FileSaver/FileSaver',
    gridster: 'bower_components/gridster/dist/jquery.gridster',
    'leaflet-heat': 'bower_components/Leaflet.heat/dist/leaflet-heat',
    jquery: 'bower_components/jquery/dist/jquery',
    leaflet: 'bower_components/leaflet/dist/leaflet',
    'leaflet-draw': 'bower_components/leaflet-draw/dist/leaflet.draw',
    lodash_src: 'bower_components/lodash/dist/lodash',
    'lodash-deep': 'bower_components/lodash-deep/factory',
    moment: 'bower_components/moment/moment',
    'ng-clip': 'bower_components/ng-clip/src/ngClip',
    text: 'bower_components/requirejs-text/text',
    zeroclipboard: 'bower_components/zeroclipboard/dist/ZeroClipboard',
    marked: 'bower_components/marked/lib/marked',
    numeral: 'bower_components/numeral/numeral',
    'ng-table': 'bower_components/ng-table/ng-table',
    'webitel_iframe': 'plugins/iframe/iframe',
    'webitelLibrary': 'plugins/webitel_plugin/webitelLib',
    'timer': 'bower_components/angular-timer/dist/angular-timer',
    'humanize-duration': 'bower_components/humanize-duration/humanize-duration',

    'webitel_cti': 'plugins/webitel_plugin/cti_panel/WebitelPanel/webitel_panel',
    'jscrollpane': 'plugins/webitel_plugin/cti_panel/WebitelPanel/js/jquery.jscrollpane.min',
    'simplemodal': 'plugins/webitel_plugin/cti_panel/WebitelPanel/js/jquery.simplemodal.1.4.4.min',
    'selectBox': 'plugins/webitel_plugin/cti_panel/WebitelPanel/js/jquery.selectBox',
    'verto': 'plugins/webitel_plugin/cti_panel/WebitelPanel/js/webitel_verto',
  },
  shim: {
    angular: {
      deps: ['jquery'],
      exports: 'angular'
    },

    gridster: ['jquery', 'css!bower_components/gridster/dist/jquery.gridster.css'],
    'angular-route': ['angular'],
    'elasticsearch': ['angular'],
    'angular-bootstrap': ['angular'],
    'angular-bindonce': ['angular'],
    'ace-json': ['ace'],
    'angular-ui-ace': ['angular', 'ace', 'ace-json'],
    'ng-clip': ['angular', 'zeroclipboard'],
    'leaflet-heat': {
      deps: ['leaflet']
    },
    file_saver: {
      exports: 'saveAs'
    },
    'leaflet-draw': {
      deps: ['leaflet', 'css!bower_components/leaflet-draw/dist/leaflet.draw.css']
    },
    leaflet: {
      deps: ['css!bower_components/leaflet/dist/leaflet.css']
    },
    marked: {
      exports: 'marked'
    },
    'ng-table': {
      deps: ['angular']
    },
    //  'ngSanitize': {
    //   deps: ['angular']
    // },
    "webitel": {
      deps: ['angular']
    },
    "webitel_iframe": {
      deps: ['angular']
    },
    'timer': {
      deps: ['angular', 'humanize-duration', 'moment']
    }
  },
  waitSeconds: 60
});

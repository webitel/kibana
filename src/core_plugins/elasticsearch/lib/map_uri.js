'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = mapUri;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _url = require('url');

var _filter_headers = require('./filter_headers');

var _filter_headers2 = _interopRequireDefault(_filter_headers);

var _set_headers = require('./set_headers');

var _set_headers2 = _interopRequireDefault(_set_headers);

function mapUri(server, prefix) {
  var config = server.config();

  function joinPaths(pathA, pathB) {
    return (0, _lodash.trimRight)(pathA, '/') + '/' + (0, _lodash.trimLeft)(pathB, '/');
  }

  return function (request, done) {

    /*WEBITEL*/
    const credentials = request.auth.credentials;
    if (!credentials) {
      return done(new Error('Session unauthorized'));
    }
    
    var _parseUrl = (0, _url.parse)(config.get('elasticsearch.url'), true);

    var esUrlProtocol = _parseUrl.protocol;
    var esUrlHasSlashes = _parseUrl.slashes;
    var esUrlAuth = _parseUrl.auth;
    var esUrlHostname = _parseUrl.hostname;
    var esUrlPort = _parseUrl.port;
    var esUrlBasePath = _parseUrl.pathname;
    var esUrlQuery = _parseUrl.query;

    // copy most url components directly from the elasticsearch.url
    var mappedUrlComponents = {
      protocol: esUrlProtocol,
      slashes: esUrlHasSlashes,
      auth: esUrlAuth,
      hostname: esUrlHostname,
      port: esUrlPort
    };

    // pathname
    var reqSubPath = request.path.replace('/elasticsearch', '');
    /*WEBITEL*/
    if (credentials.domain) {

      if (/.\/_mget|_msearch|_mapping|_field_stats|index-pattern|\.kibana./.test(reqSubPath)) {
        let _paths = reqSubPath.split('/');
        if (_paths.length > 2) {
          _paths[1] +=  '-' + credentials.domain
        }

        reqSubPath = _paths.join('/');
      }

     // console.log('\x1b[31m', `>>> ${reqSubPath}` ,'\x1b[0m');

      let payload = request.payload ? request.payload.toString('utf8') : null;
      if (payload) {
        payload = payload.replace(/"(_?)index":"([\s\S]*?)"/gi, function (a, s, b) {
          return '"' + s + 'index":"' + b + '-' + credentials.domain + '"';
        });
        request.payload = new Buffer(payload);
       // console.log('\x1b[31m', `>>> ${payload}` ,'\x1b[0m');
      }
    }

    mappedUrlComponents.pathname = joinPaths(esUrlBasePath, reqSubPath);

    // querystring
    var mappedQuery = (0, _lodash.defaults)((0, _lodash.omit)(request.query, '_'), esUrlQuery || {});
    if (Object.keys(mappedQuery).length) {
      mappedUrlComponents.query = mappedQuery;
    }

    var filteredHeaders = (0, _filter_headers2['default'])(request.headers, config.get('elasticsearch.requestHeadersWhitelist'));
    var mappedHeaders = (0, _set_headers2['default'])(filteredHeaders, config.get('elasticsearch.customHeaders'));
    var mappedUrl = (0, _url.format)(mappedUrlComponents);

    console.log(mappedUrl, mappedHeaders);

    done(null, mappedUrl, mappedHeaders);
  };
}

;
module.exports = exports['default'];
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = mapUri;

var _lodash = require('lodash');

var _url = require('url');

var _filter_headers = require('./filter_headers');

var _filter_headers2 = _interopRequireDefault(_filter_headers);

var _set_headers = require('./set_headers');

var _set_headers2 = _interopRequireDefault(_set_headers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function mapUri(cluster, proxyPrefix) {
  function joinPaths(pathA, pathB) {
    return (0, _lodash.trimRight)(pathA, '/') + '/' + (0, _lodash.trimLeft)(pathB, '/');
  }

  return function (request, done) {

    /*WEBITEL*/
    const credentials = request.auth.credentials;
    if (!credentials) {
      return done(new Error('Session unauthorized'));
    }


    var _parseUrl = (0, _url.parse)(cluster.getUrl(), true);

    const esUrlProtocol = _parseUrl.protocol,
          esUrlHasSlashes = _parseUrl.slashes,
          esUrlAuth = _parseUrl.auth,
          esUrlHostname = _parseUrl.hostname,
          esUrlPort = _parseUrl.port,
          esUrlBasePath = _parseUrl.pathname,
          esUrlQuery = _parseUrl.query;

    // copy most url components directly from the elasticsearch.url

    const mappedUrlComponents = {
      protocol: esUrlProtocol,
      slashes: esUrlHasSlashes,
      auth: esUrlAuth,
      hostname: esUrlHostname,
      port: esUrlPort
    };

    // pathname

    /*WEBITEL*/
    let reqSubPath = request.path.replace(proxyPrefix, '');
    // console.log(reqSubPath);
    // console.log(request.payload ? request.payload.toString('utf8') : null);

    if (credentials.domain) {
      var _r = /.\/_mget|_msearch|_search|_mapping|_field_stats|index-pattern|\.kibana./.exec(reqSubPath);
      if (_r) {
        let _paths = reqSubPath.split('/');
        if (_paths.length > 2 && !~_r.indexOf(_paths[1])) {
          _paths[1] +=  '-' + credentials.domain
        }

        reqSubPath = _paths.join('/');
      }

      console.log('\x1b[31m', `>>> ${reqSubPath}` ,'\x1b[0m');

      let payload = request.payload ? request.payload.toString('utf8') : null;
      if (payload) {

        const payloadLines = payload.split(/\n/);

        for (let i = 0; i < payloadLines.length; i+=2) {
          //console.log(payloadLines[i]);
          if (!payloadLines[i])
              continue;

          let topLineJson = JSON.parse(payloadLines[i]);
          let indx = (topLineJson.index || topLineJson._index);
          if (indx instanceof Array) {
            indx = indx.map(i => {
              if (i.endsWith(credentials.domain)) {
                return i;
              }

              return i + credentials.domain;
            });

          } else if (indx && !indx.endsWith(credentials.domain)) {
            indx += credentials.domain
          }

          if (topLineJson.index) {
            topLineJson.index = indx;
          } else if (topLineJson._index) {
            topLineJson._index = indx;
          }

          payloadLines[i] = JSON.stringify(topLineJson);

          if (/"_index":/.test(payloadLines[0])) {
            payloadLines[i] = payloadLines[i].replace(/"_index":"([\s\S]*?)"/gi, function (a, s, b) {
              return '"_index":"' + s + '-' + credentials.domain + '"';
            });
          }
        }

        payload = payloadLines.join('\n');
        request.payload = new Buffer(payload);
        console.log('\x1b[31m', `>>> ${payload}` ,'\x1b[0m');
      }
    }


    mappedUrlComponents.pathname = joinPaths(esUrlBasePath, reqSubPath);

    // querystring
    const mappedQuery = (0, _lodash.defaults)((0, _lodash.omit)(request.query, '_'), esUrlQuery);
    if (Object.keys(mappedQuery).length) {
      mappedUrlComponents.query = mappedQuery;
    }

    const filteredHeaders = (0, _filter_headers2.default)(request.headers, cluster.getRequestHeadersWhitelist());
    const mappedHeaders = (0, _set_headers2.default)(filteredHeaders, cluster.getCustomHeaders());
    const mappedUrl = (0, _url.format)(mappedUrlComponents);
    done(null, mappedUrl, mappedHeaders);
  };
}
module.exports = exports['default'];

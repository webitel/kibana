import { defaults, omit, trimLeft, trimRight } from 'lodash';
import { parse as parseUrl, format as formatUrl } from 'url';
import filterHeaders from './filter_headers';
import setHeaders from './set_headers';

export default function mapUri(cluster, proxyPrefix) {
  function joinPaths(pathA, pathB) {
    return trimRight(pathA, '/') + '/' + trimLeft(pathB, '/');
  }

  return function (request, done) {

    /*WEBITEL*/
    const credentials = request.auth.credentials;
    if (!credentials) {
      return done(new Error('Session unauthorized'));
    }


    const {
      protocol: esUrlProtocol,
      slashes: esUrlHasSlashes,
      auth: esUrlAuth,
      hostname: esUrlHostname,
      port: esUrlPort,
      pathname: esUrlBasePath,
      query: esUrlQuery
    } = parseUrl(cluster.getUrl(), true);

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
      const _r = /.\/_mget|_msearch|_search|_mapping|_field_stats|index-pattern|\.kibana./.exec(reqSubPath);
      if (_r) {
        const _paths = reqSubPath.split('/');
        if (_paths.length > 2 && !~_r.indexOf(_paths[1])) {
          _paths[1] +=  '-' + credentials.domain;
        }

        reqSubPath = _paths.join('/');
      }

      console.log('\x1b[31m', `>>> ${reqSubPath}`, '\x1b[0m');

      let payload = request.payload ? request.payload.toString('utf8') : null;
      if (payload) {

        const payloadLines = payload.split(/\n/);

        for (let i = 0; i < payloadLines.length; i += 2) {
          //console.log(payloadLines[i]);
          if (!payloadLines[i])
          {continue;}

          const topLineJson = JSON.parse(payloadLines[i]);
          let indx = (topLineJson.index || topLineJson._index);
          if (indx instanceof Array) {
            indx = indx.map(i => {
              if (i.endsWith(credentials.domain)) {
                return i;
              }

              return i + credentials.domain;
            });

          } else if (indx && !indx.endsWith(credentials.domain)) {
            indx += credentials.domain;
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
        console.log('\x1b[31m', `>>> ${payload}`, '\x1b[0m');
      }
    }

    mappedUrlComponents.pathname = joinPaths(esUrlBasePath, reqSubPath);

    // querystring
    const mappedQuery = defaults(omit(request.query, '_'), esUrlQuery);
    if (Object.keys(mappedQuery).length) {
      mappedUrlComponents.query = mappedQuery;
    }

    const filteredHeaders = filterHeaders(request.headers, cluster.getRequestHeadersWhitelist());
    const mappedHeaders = setHeaders(filteredHeaders, cluster.getCustomHeaders());
    const mappedUrl = formatUrl(mappedUrlComponents);
    done(null, mappedUrl, mappedHeaders);
  };
}

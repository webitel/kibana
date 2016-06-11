const createAgent = require('./create_agent');
const mapUri = require('./map_uri');
const { resolve } = require('url');
const { assign, defaults } = require('lodash');
import Wreck from 'wreck';


function createProxy(server, method, route, config) {
  const agent = createAgent(server);
  const timeout = server.config().get('elasticsearch.requestTimeout');
  const mapUriFn = mapUri(server);
  const options = {
    method: method,
    path: createProxy.createPath(route),
    config: {
      timeout: {
        socket: server.config().get('elasticsearch.requestTimeout')
      }
    },
    handler: (request, reply) => {
      let options = {
        headers: defaults({}, request.headers),
        payload: request.payload ? request.payload.toString('utf8') : null,
        timeout: timeout
      };

      mapUriFn(request, (err, uri) => {

        if (err) {
          // TODO
          console.log(err)
          return;
        }

        let credentials = request.auth.credentials;
        if (!credentials) {
          return reply(new Error('Session unauthorized'));
        };
        if (credentials.domain) {
          if (/.\/_mapping\/./i.test(uri)) {
            uri = joinStringFromIndex(uri, credentials.domain, uri.indexOf('/_mapping'));
          } else if (/.kibana\//.test(uri)) {
            uri = joinStringFromIndex(uri, credentials.domain, uri.indexOf('.kibana') + 7);
          } else if (/\/_field_stats/i.test(uri)) {
            uri = joinStringFromIndex(uri, credentials.domain, uri.indexOf('/_field_stats') );
          }

          if (options.payload) {
            options.payload = options.payload.replace(/"(_?)index":"([\s\S]*?)"/gi, function (a, s, b) {
              return '"' + s + 'index":"' + b + '-' + credentials.domain + '"';
            });
          }
        }

        console.log(uri, options.payload);

        let contentType = request.headers['content-type'];
        if (contentType) {
          options.headers['content-type'] = contentType;
        }
        let protocol = uri.split(':', 1)[0];

        if (request.info.remoteAddress &&
            request.info.remotePort) {

          options.headers['x-forwarded-for'] = (options.headers['x-forwarded-for'] ? options.headers['x-forwarded-for'] + ',' : '') + request.info.remoteAddress;
          options.headers['x-forwarded-port'] = (options.headers['x-forwarded-port'] ? options.headers['x-forwarded-port'] + ',' : '') + request.info.remotePort;
          options.headers['x-forwarded-proto'] = (options.headers['x-forwarded-proto'] ? options.headers['x-forwarded-proto'] + ',' : '') + protocol;
        }
        // Create the request and pipe the response
        Wreck.request(request.method, uri, options, (err, res) => {
          let response = reply(res)
              .ttl(null)
              .code(res.statusCode)

        });
      });

    }
    // handler: {
    //   proxy: {
    //     mapUri: mapUri(server),
    //     passThrough: true,
    //     agent: createAgent(server),
    //     xforward: true,
    //     timeout: server.config().get('elasticsearch.requestTimeout')
    //   }
    // }
  };

  if (method != "GET" && method != 'HEAD') {
    options.config.payload = {
      output: 'data',
        parse: false
    }
  }

  assign(options.config, config);

  server.route(options);
};

createProxy.createPath = function createPath(path) {
  const pre = '/elasticsearch';
  const sep = path[0] === '/' ? '' : '/';
  console.log(`proxy: ${pre}${sep}${path}`);
  return `${pre}${sep}${path}`;
};

module.exports = createProxy;


function joinStringFromIndex(x1, x2, i) {
  return x1.slice(0, i) + '-' + x2 + x1.slice(i)
}
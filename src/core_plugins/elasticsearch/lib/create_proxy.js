import createAgent from './create_agent';
import mapUri from './map_uri';
import { assign } from 'lodash';

export function createPath(prefix, path) {
  path = path[0] === '/' ? path : `/${path}`;
  prefix = prefix[0] === '/' ? prefix : `/${prefix}`;

  return `${prefix}${path}`;
}

export function createProxy(server, method, path, config) {
  const proxies = new Map([
    ['/elasticsearch', server.plugins.elasticsearch.getCluster('data')],
  ]);

  const responseHandler = function (err, upstreamResponse, request, reply) {
    if (err) {
      reply(err);
      return;
    }

    if (upstreamResponse.headers.location) {
      // TODO: Workaround for #8705 until hapi has been updated to >= 15.0.0
      upstreamResponse.headers.location = encodeURI(upstreamResponse.headers.location);
    }

    reply(null, upstreamResponse);
  };

  for (const [proxyPrefix, cluster] of proxies) {
    const options = {
      method,
      path: createPath(proxyPrefix, path),
      config: {
        timeout: {
          socket: cluster.getRequestTimeout()
        },
        /*WEBITEL*/
        payload: (method === 'GET' || method === 'HEAD') ? undefined :  {
          output: 'data',   // These are default options
          parse: false       // These are default options
        }
      },
      handler: {
        proxy: {
          mapUri: mapUri(cluster, proxyPrefix),
          agent: createAgent({
            url: cluster.getUrl(),
            ssl: cluster.getSsl()
          }),
          xforward: true,
          timeout: cluster.getRequestTimeout(),
          onResponse: responseHandler
        }
      },
    };

    assign(options.config, config);

    server.route(options);
  }
}

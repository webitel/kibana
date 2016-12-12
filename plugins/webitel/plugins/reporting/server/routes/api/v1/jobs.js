/**
 * Created by igor on 06.12.16.
 */

"use strict";

import Joi from 'joi';

const indexName = '.reporting';
const typeName = 'reporting';
const typeNameVis = 'vis';
import { JobManager } from '../../../../lib/job_manager'

export default (server) => {
    const elasticsearch = server.plugins.elasticsearch.client;
    const jobManager = new JobManager(server);

    server.route({
        method: 'GET',
        path: '/api/reporting/v1/jobs',
        handler(request, reply) {
            elasticsearch.search({
                index: getIndexName(request)
            }, reply);
        }
    });
    server.route({
        method: 'GET',
        path: '/api/reporting/v1/jobs/{name}',
        handler(request, reply) {
            const name = request.params.name;
            elasticsearch.get({
                index: getIndexName(request),
                type: typeName,
                id: name
            }, reply);

        }
    });

    server.route({
      method: 'PUT',
      path: '/api/reporting/v1/jobs/{name}',
      handler(request, reply) {
        const name = request.params.name;
        const {vis} = request.payload;
        elasticsearch.update({
          index: getIndexName(request),
          type: typeName,
          id: name,
          refresh: "true",
          body: {
            doc: {
              vis: vis
            }
          }
        }, (err, res) => {
          if (err)
            return reply(err);
          jobManager.reload();
          return reply(null, res)
        });

      }
    });


    server.route({
        method: 'DELETE',
        path: '/api/reporting/v1/jobs/{name}',
        handler(request, reply) {
            const name = request.params.name;
            elasticsearch.delete({
                index: getIndexName(request),
                refresh: "true",
                type: typeName,
                id: name
            }, (err, res) => {
              if (err)
                return reply(err);
              jobManager.reload();
              return reply(null, res)
            });

        }
    });

    server.route({
        method: 'POST',
        path: '/api/reporting/v1/jobs',
        handler(request, reply) {
            const {name, cron, dateInterval, emails, vis, subject, text} = request.payload;

            elasticsearch.index({
                index: getIndexName(request),
                type: typeName,
                id: name,
                refresh: "true",
                body: {
                    domain: request.auth.credentials.domain,
                    cron,
                    dateInterval,
                    emails,
                    vis,
                    subject,
                    text
                }
            }, (err, res) => {
              if (err)
                return reply(err);
              jobManager.reload();
              return reply(null, res)
            });
        },
        config: {
            // validate: {
            //     payload: {
            //         name: Joi.string().required(),
            //         cron: Joi.string().required(),
            //         dateInterval: Joi.string().required(),
            //         emails: Joi.string().required(),
            //         vis: Joi.string().required()
            //     }
            // }
        }
    });

    server.route({
      method: 'GET',
      path: '/api/reporting/v1/email',
      handler(request, reply) {
        elasticsearch.get({
          index: getIndexName(request, '.email'),
          type: 'emailConfig',
          id: 'settings'
        }, reply);

      }
    });

    server.route({
      method: 'POST',
      path: '/api/reporting/v1/email',
      handler(request, reply) {
        const {host, auth, from, port, secure} = request.payload;
        elasticsearch.index({
          index: getIndexName(request, '.email'),
          type: 'emailConfig',
          id: 'settings',
          refresh: "true",
          body: {
            host,
            auth,
            from,
            port,
            secure
          }
        }, reply);

      }
    });
}

function getIndexName(request, i) {
    const domain = request.auth.credentials.domain;
    if (domain) {
        return `${i || indexName}-${domain}`
    } else {
        return i || indexName
    }
}

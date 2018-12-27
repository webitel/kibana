/**
 * Created by igor on 07.12.16.
 */

"use strict";

import {Job} from './job'

const indexName = '.reporting';

export class JobManager {
  constructor (server) {
    this.jobs = {};
    this.server = server;
    this.client = server.plugins.elasticsearch.getCluster('admin').getClient();
   // console.dir(this.client, {depth: 10});
    this._init();
  }

  _init () {
    this.client.search({
      index: `${indexName}*`
    }).then(
      data => {
        data.hits.hits.forEach( jobData => {
          const job = new Job(jobData, this.client, this.server);
          this.jobs[job.id] = job;
        })
      },
      e => console.error(e)
    );
  }

  reload () {
    for (let key in this.jobs) {
      this.jobs[key].stop();
      delete this.jobs[key];
    }
    
    this._init();
  }

  postJob (id, job) {

  }
}


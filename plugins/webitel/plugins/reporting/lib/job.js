/**
 * Created by igor on 07.12.16.
 */

"use strict";

import cronParser from 'cron-parser';
import async from 'async';
import _ from 'lodash';
import {parse} from './parseResponse';
import {makeFile} from './makeFile';
import {sendMail} from './sendMail';

export class Job {
  constructor (options = {}, client) {
    this.id = options._id; // TODO add domain
    this.domain = options._source.domain;

    this.settingsIndex = this.domain ? `.kibana-${this.domain}` : '.kibana';
    this.data = options._source;
    this.client = client;
    this.timerId = null;
    this.dateInterval = options._source.dateInterval || {};
    try {
      this.interval = cronParser.parseExpression(this.data.cron);
      console.log(`Create job ${this.id} >> ${this.data.cron}`);
      this.next();
    } catch (e) {
      console.error(e)
    }
  }

  getNextIntervalMs () {
    let n = -1;
    do {
      n = this.interval.next().getTime() - Date.now()
    } while (n < 0);
    return n;
  }

  stop () {
    clearTimeout(this.timerId)
  }

  next () {
    const intervalMs = this.getNextIntervalMs();
    clearTimeout(this.timerId);
    this.timerId = setTimeout( () => {
      console.log(`Execute job ${this.id}`);
      this.loadEmailConfig((err, emailData) => {
        if (err) {
          console.error(err);
          return this.next();
        }

        const emailConf = emailData && emailData._source;
        if (!emailConf) {
          console.error(`Not found domain settings`);
          return this.next();
        }

        this.loadVisData(emailConf, (err, res) => {
          if (err)
            console.error(err);
          this.next();
        });
      });

    }, intervalMs);
  }

  loadEmailConfig (done) {
    const index = this.domain ? `.email-${this.domain}` : '.email';
    this.client.get({
      index: index,
      type: 'emailConfig',
      id: 'settings'
    }, done);
  }

  loadVisData (emailConfig, done) {
    if (this.data.vis instanceof Array) {
      // console.log(this.data.vis);
      async.mapSeries(
        this.data.vis,
        (vis, cb) => {
          let b = _.clone(vis.body, true);

          b.query.bool.must.push({
            "range": {
              "variables.start_stamp": {
                "gte": this.dateInterval.from,
                "lte": this.dateInterval.to
              }
            }
          });
          // console.dir({     "range": {
          //   "variables.start_stamp": {
          //     "gte": this.dateInterval.from,
          //     "lte": this.dateInterval.to
          //   }
          // }})
          this.client.search({
            index: (vis.indexPattern || "cdr*") + (this.domain ? `-${this.domain}` : ''),
            body: b
          }, function (err, res) {
            if (err)
              return cb(err)
            try {
              const writer = parse(vis.state, res);
              makeFile(writer, vis, cb);
            } catch (e) {
              return cb(e)
            }
          })
        },
        (err, data) => {
          if (err)
            return done(err);
          sendMail(emailConfig, this, data, done);
        }
      )

    } else {
      done(new Error(`No selected visualization`));
    }
  }
}

//
//
// const parser = require('cron-parser'),
//   log = require(`${__appRoot}/lib/log`)(module)
//   ;
//
// class Scheduler {
//   constructor (cronFormat, fn) {
//     let _timer = null;
//     const interval = parser.parseExpression(cronFormat);
//     const _c = cronFormat;
//     log.info(`Create job: ${fn.name || ''}`);
//
//     (function shed() {
//       if (_timer)
//         clearTimeout(_timer);
//
//       let n = -1;
//       do {
//         n = interval.next().getTime() - Date.now()
//       } while (n < 0);
//
//       log.trace(`Next exec schedule: ${fn.name || ''} ${n}`);
//       _timer = setTimeout( function tick() {
//         log.trace(`Exec schedule: ${fn.name || ''} ${_c}`);
//         fn.apply(null, [shed]);
//       }, n);
//     })()
//   }
// }

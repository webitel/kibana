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
    this.timeZone = options._source.timezone;
    this.settingsIndex = this.domain ? `.kibana-${this.domain}` : '.kibana'; //todo
    this.data = options._source;
    this.client = client;
    this.timerId = null;
    this.dateInterval = options._source.dateInterval || {};
    try {
      this.interval = cronParser.parseExpression(this.data.cron, {tz: this.timeZone});
      console.log(`Create job ${this.id} >> ${this.data.cron}`);
      this.next();
    } catch (e) {
      console.error(e)
    }
  }

  getNextIntervalMs () {
    let n = -1;
    let nextJob;
    do {
      nextJob = this.interval.next();
      n = nextJob.getTime() - Date.now()
    } while (n < 0);
    console.log(`Job ${this.id} execute time ${new Date(nextJob.getTime())} (interval ${n})`);
    return n;
  }

  stop () {
    clearTimeout(this.timerId)
  }

  next (intervalMs) {

    if (!intervalMs)
        intervalMs = this.getNextIntervalMs();

    clearTimeout(this.timerId);

    const fn = () => {
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

    };

    if (intervalMs > 0x7FFFFFFF) {//setTimeout limit is MAX_INT32=(2^31-1)
      console.warn(`intervalMs > 0x7FFFFFFF, divide segment ${intervalMs}`);
      setTimeout(() => {
        this.next(intervalMs - 0x7FFFFFFF);
      }, 0x7FFFFFFF);
    } else {
      this.timerId = setTimeout(fn, intervalMs);
    }
  }

  loadEmailConfig (done) {
    const index = this.domain ? `.email-${this.domain}` : '.email';
    this.client.get({
      index: index,
      type: 'emailConfig',
      id: 'settings'
    }, done);
  }

  getIndexName (id, cb) {
    this.client.get({
      index: this.settingsIndex,
      type: 'doc',
      id: `index-pattern:${id}`,
      _sourceInclude: ["index-pattern.title"]
    }, function (err, response) {
      if (err) {
        return cb(err)
      }

      const title = response.found && response._source["index-pattern"] && response._source["index-pattern"].title;
      return cb(null, title);
    });
  }

  loadVisData (emailConfig, done) {
    if (this.data.vis instanceof Array) {
      // console.log(this.data.vis);
      async.mapSeries(
        this.data.vis,
        (vis, cb) => {
          let b = _.clone(vis.body, true);
          if (this.timeZone)
            replaceTimeZone(vis.body.aggs, '', this.timeZone);

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




          this.getIndexName(vis.indexPattern, (err, indexName) => {
            if (err)
              return cb(err);

            if (!indexName) {
              return cb(new Error(`No found index name!!1 from: ${vis.indexPattern}`))
            }
            this.client.search({
              index: indexName + (this.domain ? `-${this.domain}` : ''),
              body: b
            }, function (err, res) {
              if (err)
                return cb(err);
              try {
                const writer = parse(vis.state, res);
                makeFile(writer, vis, cb);
              } catch (e) {
                return cb(e)
              }
            })
          });

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

function replaceTimeZone(obj, stack, timeZone) {
  for (var property in obj) {
    if (obj.hasOwnProperty(property)) {
      if (typeof obj[property] == "object") {
        replaceTimeZone(obj[property], stack + '.' + property, timeZone);
      } else if (property === 'time_zone') {
        console.log(`Set timezone ${timeZone}`);
        obj[property] = timeZone;
      }
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

/**
 * Created by igor on 07.12.16.
 */

"use strict";

import cronParser from 'cron-parser';
import _ from 'lodash';
import {parse} from './parseResponse';
import {makeFile} from './makeFile';
import {sendMail} from './sendMail';

export class Job {
    constructor({_id, _source}, client, server) {
        this.id = _id;
        this.server = server;
        this.domain = _source.domain;
        this.timeZone = _source.timezone;
        this.emails = _source.emails;
        this.subject = _source.subject;
        this.text = _source.text;
        this.settingsIndex = this.domain ? `.kibana-${this.domain}` : '.kibana'; //todo
        this.client = client;
        this.timerId = null;
        this.dateInterval = _source.dateInterval || {};

        try {
            this.interval = cronParser.parseExpression(_source.cron, {tz: this.timeZone});
            server.log(['info', 'reporting'], `Create job ${this.id} >> ${_source.cron}`);
            this.next();
        } catch (e) {
            server.log(['error', 'reporting'], e);
        }
    }

    getNextIntervalMs() {
        let n = -1;
        let nextJob;
        do {
            nextJob = this.interval.next();
            n = nextJob.getTime() - Date.now()
        } while (n < 0);
        this.server.log(['info', 'reporting'], `Job ${this.id} execute time ${new Date(nextJob.getTime())} (interval ${n})`);
        return n;
    }

    stop() {
        clearTimeout(this.timerId)
    }

    async next(intervalMs) {
        if (!intervalMs)
            intervalMs = this.getNextIntervalMs();

        clearTimeout(this.timerId);

        const fn = async () => {
            this.server.log(['info', 'reporting'], `Execute job ${this.id}`);
            try {
                const email = await this.loadEmailConfig();
                const jobData = await this.loadVisConfig();

                const attachments = [];
                for (let vis of jobData.vis) {
                    attachments.push(await this.getVisData(vis));
                }

                sendMail(email, this, attachments, (e)=> {
                    if (e) {
                        this.server.log(['error', 'reporting'], `Send email job ${this.id}: ${e.message}`);
                    }
                });
            } catch (e) {
                this.server.log(['error', 'reporting'], `Execute job: ${e.message}`);
            } finally {
                this.next();
            }
            this.server.log(['info', 'reporting'], `Execute job ${this.id} end`);
        };

        if (intervalMs > 0x7FFFFFFF) {//setTimeout limit is MAX_INT32=(2^31-1)
            console.warn(`intervalMs > 0x7FFFFFFF, divide segment ${intervalMs}`);
            setTimeout(async () => {
                await this.next(intervalMs - 0x7FFFFFFF);
            }, 0x7FFFFFFF);
        } else {
            this.timerId = setTimeout(fn, intervalMs);
        }
    }

    async loadEmailConfig() {
        const index = this.domain ? `.email-${this.domain}` : '.email';
        const result = await this.client.get({
            index: index,
            type: 'emailConfig',
            id: 'settings'
        });
        return result._source;
    }

    async loadVisConfig() {
        const index = this.domain ? `.reporting-${this.domain}` : '.reporting';
        const result = await this.client.get({
            index: index,
            type: 'reporting',
            id: this.id
        });
        return result._source;
    }

    async getIndexName(id) {
        const response = await this.client.get({
            index: this.settingsIndex,
            type: 'doc',
            id: `index-pattern:${id}`,
            _sourceInclude: ["index-pattern.title"]
        });
        return response.found && response._source["index-pattern"] && response._source["index-pattern"].title
    }

    async getVisData(vis) {
        const indexPattern = await this.getIndexName(vis.indexId);
        const body = _.clone(vis.body, true);
        if (this.timeZone)
            replaceTimeZone(body.aggs, '', this.timeZone);

        body.query.bool.must.push({
            "range": {
                "created_time": {
                    "gte": this.dateInterval.from,
                    "lte": this.dateInterval.to
                }
            }
        });

        const data = await this.client.search({
            index: indexPattern + (this.domain ? `-${this.domain}` : ''),
            body
        });

        const writer = parse(vis.state, data);
        return await makeFile(writer, vis);

    }
}

function replaceTimeZone(obj, stack, timeZone) {
    for (let property in obj) {
        if (obj.hasOwnProperty(property)) {
            if (typeof obj[property] === "object") {
                replaceTimeZone(obj[property], stack + '.' + property, timeZone);
            } else if (property === 'time_zone') {
                obj[property] = timeZone;
            }
        }
    }
}

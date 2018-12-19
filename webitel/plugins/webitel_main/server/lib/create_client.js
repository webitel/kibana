/**
 * Created by igor on 04.11.16.
 */

"use strict";

import request from 'request';

export default class Client {
    _baseUrl = null;
    constructor(server) {
        const config = server.config();
        this._baseUrl = config.get('webitel.main.engineAuthUri') || config.get('webitel.main.engineUri');

        this.error = err => {
            server.log(['error', 'webitel_api'], err)
        };

        this.debug = msg => {
            server.log(['debug', 'webitel_api'], msg)
        }
    }

    async api(method = "GET", path = "/", data, headers = {}) {
        const options = {
            method: method,
            uri: this._baseUrl + path,
            json: data,
            headers
        };

        return new Promise((resolve, reject) =>{
            request(options, (err, resp, body) => {
                if (err) {
                    err.status = resp ? resp.statusCode : 500;
                    this.error(err);
                    reject(err)
                } else if (resp.statusCode !== 200) {
                    err = new Error(`${body.info || resp.statusMessage}`);
                    err.status = resp.statusCode;
                    this.error(err);
                    reject(err)
                } else {
                    this.debug(`Api -${method} ${path} successful`);
                    resolve(typeof body === 'string' ? JSON.parse(body) : body)
                }
            });
        });
    }
}
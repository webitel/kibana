/**
 * Created by igor on 04.11.16.
 */

"use strict";

import request from 'request';

export function Client (config) {
    const baseUrl = config.get('webitel.main.engineUri');

    return {
        api: function (method = "GET", path = "/", data, cb = ()=>{}) {
            let options = {
                method: method,
                uri: baseUrl + path,
                json: data
            };
            request(options, cb);
        }
    }
}

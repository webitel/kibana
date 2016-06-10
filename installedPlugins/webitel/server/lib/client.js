/**
 * Created by igor on 10.06.16.
 */

import request from 'request';

export function Client (config) {
  const baseUrl = config.get('webitel.engineUri');

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

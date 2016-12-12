/**
 * Created by igor on 09.12.16.
 */

"use strict";

export default class Vis {
  constructor (job, params = {}, jobVisData = {}) {
    this.title = params.title;
    this.settingsIndex = job.settingsIndex;
    this.savedSearchId = params.savedSearchId;
    this.visState = JSON.parse(params.visState);
    this.dsl = jobVisData.dsl;
    this._body = null;
    if (params.kibanaSavedObjectMeta && params.kibanaSavedObjectMeta.searchSourceJSON) {
      try {
        this._body = JSON.parse(params.kibanaSavedObjectMeta.searchSourceJSON);
      }
      catch (e) {
        console.error(e)
      }
    }

  }

  exec (client, dateConf) {
    this.getBody(client, (err, body) => {
      if (err)
        return console.error(err);

      if (this.dsl)
        body.agg = this.dsl;
      console.log(body);
      throw 1
      // client.search(body).then(
      //   data => consol
      // )
    })
  }

  getBody (client, cb) {
    if (this.savedSearchId) {
      client.get({
        index: this.settingsIndex,
        type: 'search',
        id: this.savedSearchId
      }, (err, res) => {
        if (err) {
          return cb(err);
        }
        try {
          let f = JSON.parse(res._source.kibanaSavedObjectMeta.searchSourceJSON);
          delete f.highlight;
          return cb(null, f)
        } catch (e) {
          return cb(e);
        }
      });
    } else if (this._body) {
      return cb(null, this._body)
    } else {
      cb(new Error('TODO: no body'));
    }
  }
}

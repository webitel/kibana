/**
 * Created by igor on 12.12.16.
 */

"use strict";

export default (server) => {
  const elasticsearch = server.plugins.elasticsearch.getCluster('admin').getClient();
}

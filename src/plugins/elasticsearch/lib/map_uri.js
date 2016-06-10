const querystring = require('querystring');
const resolve = require('url').resolve;
module.exports = function mapUri(server, prefix) {
  const config = server.config();

  return function (request, done) {
    const path = request.path.replace('/elasticsearch', '');
    let url = config.get('elasticsearch.url');
    if (path) {
      if (/\/$/.test(url)) url = url.substring(0, url.length - 1);
      url += path;
    }
    const query = querystring.stringify(request.query);
    if (query) url += '?' + query;
    //
    // let credentials = request.auth.credentials;
    // if (!credentials) {
    //   return done(new Error('Session unauthorized'));
    // }
    // if (credentials.domain) {
    //   if (/.\/_mapping\/./i.test(url)) {
    //     url = joinStringFromIndex(url, credentials.domain, url.indexOf(/_mapping/));
    //     console.log(url);
    //   }
    // }
    done(null, url);
  };
};


function joinStringFromIndex(x1, x2, i) {
  return x1.slice(0, i) + x2 + x1.slice(i)
}
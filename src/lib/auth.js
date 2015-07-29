var config = require('../config');
var httpAuth = require('http-auth');
var webitelAuth = require('../lib/webitelAuth');

module.exports = function (app) {
  var basic;
  if (config.htpasswd) {
    basic = httpAuth.basic({ file: config.htpasswd });
    return httpAuth.connect(basic);
  }
  //webitel
  else if (config.webitelAuth) {
    return webitelAuth(app);
  }
  return function (req, res, next) { return next(); };
};

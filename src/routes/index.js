var express = require('express');
var router = express.Router();
var config = require('../config');
var _ = require('lodash');

router.get('/config', function (req, res, next) {
  var keys = [
    'kibana_index',
    'default_app_id',
    'shard_timeout'
  ];
  var data = _.pick(config.kibana, keys);
  data.plugins = config.plugins;

  //igor webitel

  if (req.session && req.session['user']) {
    data['kibana_index'] += req.session.user['domain'] ? '-' + req.session.user['domain'] : "";
    data['webitelSession'] = {
      "domain": req.session.user['domain'],
      "login": req.session.user['username'],
      "password": req.session.user['password'],
      "token": req.session.user['token'],
      "key": req.session.user['key'],
      "role": req.session.user['role'],
      "ws": req.session.user['ws'],
      "hostname": req.session.user['hostname'],
      "webrtc": config.webitelWebrtc
    };
  } else {
    return res.status(401).end();
  };

  res.json(data);
});

module.exports = router;

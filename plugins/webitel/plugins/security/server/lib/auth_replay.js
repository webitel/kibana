import {validateIndex} from "./create_index";
const Boom = require('boom');

export default function replayFn(request, reply, err, res, user) {
  if (err || res.statusCode !== 200) {
    request.auth.session.clear();
    return reply(Boom.unauthorized(err));
  }
  user.password = password;
  request.server.app.cache.set(user.key, user, 0, (err) => {

    if (err) {
      server.log(['status', 'error', 'security'], err.message);
      return reply(Boom.unauthorized(err));
    }
    request.auth.session.set({ sid: user.key });
    if (user.domain)
      validateIndex(server, user.domain);
    reply(success);
  });
}

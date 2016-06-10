const root = require('requirefrom')('');

module.exports = (server) => {

  // const isValidUser = root('server/lib/is_valid_user')(server);
  const calculateExpires = root('server/lib/get_calculate_expires')(server);

  return function validate(request, session, callback) {
    const {username, password, expires} = session;
    if (expires < Date.now()) return callback(new Error('Session has expired'), false);
    console.log('validate');
    // return isValidUser(request, username, password).then(
    //   () => {
    //     // Keep the session alive
    //     request.auth.session.set({
    //       username,
    //       password,
    //       expires: calculateExpires()
    //     });
    //     return callback(null, true);
    //   },
    //   (error) => callback(error, false)
    // );
  };
};

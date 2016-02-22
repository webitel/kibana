/**
 * Created by Admin on 21.07.2015.
 */

var session = require('express-session');
var auth = require('../webitel/auth');

module.exports = function (app) {
    app.use(session({
        secret: 'webitel as sahkdlasj',
        resave: false,
        saveUninitialized: false
    }));


    app.use(function (req, res, next) {
        var chunks = [];
        req.on('data', function (chunk) {
            chunks.push(chunk);
        });
        req.on('end', function () {
            req.rawBody = Buffer.concat(chunks);
            next();
        });
    });

    app.get('/logout', function (req, res, next) {
        req.session['user'] = null;
        res.render('webitelLogin', { });
    });
    
    app.get('/login', function (req, res, next) {
        res.render('webitelLogin', { });
    });

    app.post('/login', function (req, res, next) {
        if (!req.rawBody) {
            return res.redirect('./login');
        };

        auth.login(req.rawBody, function (err, user) {
            if (err) {
                console.log(err['message']);
                return res.status(500).end();
            };

            if (!user) {
                return res.status(401).end();
            };

            req.session['user'] = user;
            res.status(200).end();
        });

    });

    return function (req, res, next) {
        //console.log(Object.keys(req.sessionStore.sessions).length);
        if (/elasticsearch/i.test(req.originalUrl)) {
            auth.validate(req, function (err) {
                if (err) {
                    console.dir(err);
                    return res.status(401).end();
                };
                return next();
            });
        } else {
            //console.log(req.session.user);
            return next();
        }
    }
};
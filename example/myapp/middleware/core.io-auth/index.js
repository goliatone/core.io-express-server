'use strict';

const extend = require('gextend');
const express = require('express');
const Keypath = require('gkeypath');
const passport = require('passport');


module.exports = function(app, config){
    console.log('--- passport');
    console.log(Object.keys(config));

    let findUserById = config.passport.findUserById;

    /*
     * We need to provide passport with a
     * way to serialize and deserialize
     * a Passport User.
     */
    passport.serializeUser((user, done) => done(null, user.id));

    passport.deserializeUser((id, done) => {
        findUserById(id).then(user => {
            done(null, user);
            return null;
        }).catch(done);
    });

    /*
     * Use all declared strategies
     */

    /*
     * Create all default routes so we can handle
     * authentication flow:
     * - login
     * - logout
     */
    let router = express.Router();

    let routeLocals = Keypath.get(config, 'routeLocals', {});
    let locals = extend({}, config.locals, routeLocals['/login']);

    router.get('/login', function(req, res, next){
        res.render('login', locals);
    });

    //TODO: config.routes.logout;
    router.get('/logout', function(req, res){
        req.logout();

        req.session.authenticated = false;

        req.session.destroy(function(err) {
            // cannot access session here
            res.redirect('/');
        });
    });

    router.get('/signup', function(req, res){
        res.render('signup', locals);
    });

    app.use('/', router);

    /*
     * Initialize session passport
     * We should be able to move this to the
     * auth submodule and pull from there.
     */
    app.use(passport.initialize());

    app.use(passport.session());
};

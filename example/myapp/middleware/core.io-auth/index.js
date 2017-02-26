'use strict';

const extend = require('gextend');
const express = require('express');
const Keypath = require('gkeypath');
const passport = require('passport');
const crypto = require('./cryptoUtils');

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
        req.session.destroy(function(err) {
            // cannot access session here
            res.redirect('/');
        });
    });

    /// THIS SHOULD BE OPTIONAL ////////////
    router.get('/signup', function(req, res){
        res.render('signup', locals);
    });

    router.post('/signup', function(req, res){
        res.render('signup', locals);

        /*config.createUser(req.body).then((user)=>{
            req.redirect('/login');
        }).catch((err)=>{
            locals.user = req.body;
            res.render('signup', locals);
        });*/
    });
    //////////////////////////////////////////
    /// LOAD STRATEGIES
    //////////////////////////////////////////
    app.post('/login', (req, res, next) => {
        passport.authenticate('local', (err, user, params) => {
            if (err) return next(err);
            if (!user) return res.status(401).json({error: params ? params.message : 'Invalid login'});
            req.login(user, {}, error => {
                if (error) return res.status(500).json({error: error.message});
                res.json({
                    user: user,
                    returnTo: (req.session && req.session.returnTo) ? req.session.returnTo : '/'
                });
                return null;
            });
        })(req, res, next);
    });

    let LocalStrategy = require('passport-local');
    passport.use(new LocalStrategy({
            usernameField: 'email'
        },(id, password, done) => {
        console.log('local strategy: id %s password %s', id, password);
        let authUser;
        return findUserById(id).then((user) => {
            console.log('findUserById:', id, user);
            if (!user) return false;
            authUser = user;
            return crypto.compare(user, password);
        }).then(isMatch => {
            if (isMatch) done(null, authUser);
            else done(null, false, {message: 'Incorrect email or password'});
            return null;
        })
        .catch(done);
    }));

    /*
     * Use all declared strategies
     */
    app.use('/', router);



    /*
     * Initialize session passport
     * We should be able to move this to the
     * auth submodule and pull from there.
     */
    app.use(passport.initialize());

    app.use(passport.session());
};

module.exports.applyPolicies = require('./applyPolicies');

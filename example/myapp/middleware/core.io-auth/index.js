/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');
const express = require('express');
const Keypath = require('gkeypath');
const passport = require('passport');
const crypto = require('./cryptoUtils');

module.exports = function(app, config){
    console.log('--- passport');
    console.log(Object.keys(config));

    /*
     * TODO: Normalize names. Should we match
     * Waterline methods or have desriptive
     * names?
     */
    let findOne = config.passport.model.findOne;
    let createUser = config.passport.model.createUser;
    let findUserById = config.passport.model.findUserById;
    let cleanUser = config.passport.model.cleanUser || _cleanUser;

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
     * Initialize session passport
     * We should be able to move this to the
     * auth submodule and pull from there.
     * This HAS to come before registering
     * router or app routes...
     */
    app.use(passport.initialize());

    app.use(passport.session());

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
            res.redirect('/');
        });
    });

    /// THIS SHOULD BE OPTIONAL ////////////
    router.get('/signup', function(req, res){
        res.render('signup', locals);
    });

    router.post('/signup', function(req, res){
        // res.render('signup', locals);
        createUser(req.body).then((user)=>{
            res.flash('info', 'User ' + user.name + ' created.');
            res.redirect('/login');
        }).catch((err)=>{
            locals.user = req.body;
            res.render('signup', locals);
        });
    });
    //////////////////////////////////////////
    /// LOAD STRATEGIES
    //////////////////////////////////////////
    /*
     * Default cleanUser function.
     */
    function _cleanUser(user){
        let clone = extend({}, user);
        delete clone.password;
        return clone;
    }

    router.post('/login', (req, res, next) => {
        passport.authenticate('local', (err, user, params) => {
            if (err) return next(err);
            if (!user){
                res.flash('error', 'Error.Passport.User.NotFound');
                return res.status(401).json({
                    error: params ? params.message : 'Invalid login'
                });
            }
            user = cleanUser(user);

            req.login(user, {}, error => {
                if (error){
                    return res.status(500).json({error: error.message});
                }

                console.log('login: req.user', req.user);
                res.locals.user = user;
                res.redirect((req.session && req.session.returnTo) ? req.session.returnTo : '/');

                return null;
            });
        })(req, res, next);
    });

    let LocalStrategy = require('passport-local');

    let strategyConfig = {
        usernameField: 'email',
        passReqToCallback: true,
        // usernameField: 'email',
        // passwordField: 'passwd',
        // session: false
    };

    passport.use(new LocalStrategy(strategyConfig,(req, id, password, done) => {
        console.log('local strategy: id %s password %s', id, password);

        let authUser;
        let query = {};
        query[strategyConfig.usernameField || 'username'] = id;

        return findOne(query).then((user) => {
            console.log('findOne:', id, user);
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
};

module.exports.applyPolicies = require('./applyPolicies');

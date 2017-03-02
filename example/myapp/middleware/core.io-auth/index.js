/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');
const express = require('express');
const Keypath = require('gkeypath');
const passport = require('passport');
const crypto = require('./cryptoUtils');

module.exports = function(app, config){

    if(!config.logger) config.logger = console;

    config.logger.info('--- passport');
    config.logger.info(Object.keys(config));

    /*
     * TODO: Normalize names. Should we match
     * Waterline methods or have desriptive
     * names?
     * Make simple:
     *
     * getUser: function(){
     *     return PassportUser;
     * },
     * getPassport: function(){
     *     return Passport;
     * }
     */
    let findOne = config.passport.model.findOne;
    let createUser = config.passport.model.createUser;
    let findUserById = config.passport.model.findUserById;
    let cleanUser = config.passport.model.cleanUser || _cleanUser;
    let deleteUser = config.passport.model.deleteUser;
    let updateUser = config.passport.model.updateUser;

    let createPassport = config.passport.model.createPassport;
    let findPassport = config.passport.mdoel.findPassport;

    /*
     * We need to provide passport with a
     * way to serialize and deserialize
     * a Passport User.
     */
    passport.serializeUser((user, done) => done(null, user.id));

    passport.deserializeUser((id, done) => {
        return findUserById(id).then(user => {
            done(null, user);
            return user;
        }).catch(done);
    });


    passport.protocols = require('./protocols')(passport, config);

    /*
     * Extend passport object with an `endpoint`
     * method to handle all 3rd party providers.
     */
    passport.endpoint = function(req, res){
        let strategies = config.passport;
        let provider = req.param('provider');
        let options = {};

        /*
         * We did not define the provider.
         */
        if(!strategies.hasOwnProperty(provider)){
            return res.redirect('/login');
        }

        ['scope', 'hd', 'display'].map(function(key){
            if(!strategies[provider].options.hasOwnProperty(key)) return;
            options[key] = strategies[provider].options[key];
        });

        this.authenticate(provider, options)(req, res, req.next);
    };

    /*
     * Create an authentication callback endpoint.
     */
    passport.callback = function(req, res, next){
        let action = req.param('action');
        let provider = req.param('provider', 'local');

        if(action === 'disconnect' && req.user){
            return this.disconnect(req, res, next);
        } else {
            next(new Error('Invalid action'));
        }

        if(provider === 'local'){
            if(action === 'register' && !req.user){
                return this.protocols.local.register(req, res, next);
            }

            if(action === 'connect' && req.user){
                return this.protocols.local.connect(req, res, next);
            }

            if(action === 'disconnect' && req.user){
                return this.protocols.local.disconnect(req, res, next);
            }

        } else {
            if( action === 'disconnect' && req.user ){
                return this.disconnect(req, res, next);
            }

            this.authenticate(provider, next)(req, res, req.next);
        }

        next(new Error('Invalid action'));
    };

    passport.connect = function(req, query, profile, next){
        let user = {};

        let provider = profile.provider || req.param('provider');

        req.session.tokens = query.tokens;

        query.provider = provider;

        if(!provider){
            return next(new Error('No authentication provider was found.'));
        }

        config.logger.info('auth profile', profile);

        if(profile.emails && profile.emails[0]){
            user.email = profile.emails[0].value;
        }

        if(profile.username){
            user.username = profile.username;
        }

        if(!user.username && !user.email){
            return next(new Error('Neither email or username was available'));
        }

        Passport.findOne({
            provider: provider,
            identifier: query.identifier.toString()
        }).then((passport)=> {
            //A new user is attempting to sign up using a 3rd
            //party auth provider.
            //Create a ne user and assign them a passport.
            if(!req.user){
                if(!passport){
                    return PassportUser.create(user).then((record)=>{
                        user = record;
                        query.user = user.id;
                        return Passport.create(query);
                    }).then((passport)=>{
                        next(null, user);
                    }).catch(next);
                }
                //An existing user is trying to log in using an
                //already connected passport. Associate user to
                //passport.
                if(query.tokens && query.tokens != passport.tokens){
                    passport.tokens = query.tokens;
                }
                return passport.save().then(()=>{
                    return PassportUser.findOne(passport.user);
                }).then((user)=>{
                    next(null, user);
                }).catch(next);
            }
            //User currently logged in, trying to connect a new passport.
            //Create and assing a new passport to the user.
            if(!passport){
                query.user = req.user.id;
                return Passport.create(query).then((passport)=>{
                    next(null, rq.user);
                }).catch(next);
            }
            //not sure what's going on here. We do have a session.
            //Just pass it along...Back button?
            next(null, req.user);

        }).catch(next);
    };

    passport.disconnect = function(req, res, next){
        let user = req.user;
        let provider = req.param('provider');

        return findOne({
            provider: provider,
            user: user.id
        }).then((record)=>{
            return deleteUser(record.id);
        }).then(()=>{
            next(null, user);
            return user;
        }).catch(next);
    };

    function loadStrategies(passport, strategies){
        let strategy;
        Object.key(strategies).map((key)=>{
            strategy = strategies[key];
            let options = {
                passReqToCallback: true
            };

            let Strategy;

            if(key === 'local'){
                options = extend({
                    usernameField: 'identifier'
                });

                if(strategies.local){
                    Strategy = strategies[key].strategy;
                    passport.use(new Strategy(options, passport.protocols.local.login));
                }
                return;
            }
            let protocol = strategies[key].protocol;
            let callback = strategies[key].callback;

            if(!callback){
                callback = require('path').join('auth', key, 'callback');
            }
            Strategy = strategies[key].strategy;
            let baseUrl = '';

            if(config.baseUrl){
                baseUrl = config.baseUrl;
            } else {
                config.logger.warn('Please set baseUrl configuration value!');
                //This WILL THROW :)
                baseUrl = app.baseUrl();
            }

            const url = require('url');

            switch (protocol) {
                case 'oauth':
                case 'oauth2':
                    options.callbackURL = url.resolve(baseUrl, callback);
                    break;
                case 'openid':
                    options.returnURL = url.resolve(baseUrl, callback);
                    options.realm = baseUrl;
                    options.profile = true;
                    break;
            }
            options = extend(options, strategies[key].options);

            passport.use(new Strategy(options, passport.protocols[protocol]));
        });
    }

    loadStrategies(passport, config.passport.strategies);

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
     * ROUTES:
     * POST /register UserController.create
     * POST /logout AuthController.logout
     *
     * POST /auth/local AuthController.callback
     * POST /auth/local/:action AuthController.callback
     *
     * POST /auth/:provider AuthController.callback
     * POST /auth/:provider/:action AuthController.callback
     *
     * GET /auth/:provider AuthController.provider
     * GET /auth/:provider/callback AuthController.callback
     * GET /auth/:provider/:action AuthController.callback
     *
     * GET /auth/google AuthController.provider
     * GET /auth/google/callback AuthController.callback
     * GET /auth/google/create AuthController.callback
     */
    let AuthController = {
        logout: function(req, res){
            /*
             * logout should be handled only
             * by POST methods.
             */
            if(req.method.toUpperCase() !== 'POST'){
                return res.send(400);
            }

            req.logout();
            delete req.user;
            delete req.session.passport;
            req.session.authenticated = false;
            // req.session.destroy((err)=>{
                res.redirect(req.query.next || '/');
            // });
        },
        /*
         * Creates a 3rd party authentication
         * endpoint.
         *
         * i.e. GET /auth/google
         *
         * This basically calls `passport.authenticate`
         * which would redirect user to the provider
         * for authentication.
         * On complete, the provider must redirect
         * the user back to /auth/:provider/callback
         */
        provider: function(req, res){
            //TODO: get passport from context?! Or pass
            //when we create AuthController...
            passport.endpoint(req, res);
        },
        /*
         * Authentication callback endpoint.
         * Handles creating and verifying `Passport`s
         * and `PassportUser`s, both locally and 3rd
         * party.
         *
         * It handles three actions:
         * - register
         * - login
         * - disconnect
         *
         */
        callback: function (req, res){
            let action = req.param('action');

            passport.callback(req, res, (err, user, info, status)=>{
                if(err || !user){
                    config.logger.warn(user, err, info, status);
                    return _negotiateError(res, err || info, action);
                }

                req.login(user, (err)=>{
                    if(err){
                        config.logger.warn('AuthController callback', err);
                        return _negotiateError(res, err, action);
                    }

                    req.session.authenticated = true;

                    if(req.query.next){
                        let url = _buildCallbacNextUrl(req);
                        res.status(302).set('Location', url);
                    }
                    config.logger.info('User authenticated OK %s', user);
                    return res.json(user);
                });
            });
        },
        /*
         * Disconnect a passport from a user.
         */
        disconnect: function(req, res){
            passport.disconnect(req, res);
        }
    };

    function _negotiateError(res, err, action){
        if(action === 'register' || action === 'login'){
            return res.redirect('/' + action);
        } else if(action === 'disconnect'){
            return res.redirect('back');
        }

        res.send(403, err);
    }

    function _buildCallbacNextUrl(req){
        const K = require('gkeypath');

        let includeToken = req.query.includeToken;
        let url = K.get(req, 'session.returnTo', req.query.next);
        let accessToken = K.get(req, 'session.tokens.accessToken');

        if(includeToken && accessToken){
            return url + '?access_token=' + accessToken;
        }

        return url;
    }

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
    router.get('/logout', AuthController.logout);

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

    passport.use(new LocalStrategy(strategyConfig,(req, identifier, password, done) => {
        console.log('local strategy: id %s password %s', identifier, password);

        let authUser;
        let query = {};
        query[strategyConfig.usernameField || 'username'] = identifier;

        return findOne(query).then((user) => {
            console.log('findOne:', identifier, user);
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

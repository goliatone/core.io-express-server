/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');
const express = require('express');
const Keypath = require('gkeypath');
const passport = require('passport');
const crypto = require('./cryptoUtils');

/**
 * Provide Passport.js support for our
 * core.io-express-server application.
 * The `app` paramter can be an Express app
 * or, more likely, a subapp.
 *
 * @method exports
 * @param  {Object} app    Express app or subapp
 * @param  {Object} config config.server value.
 * @return {void}
 */
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
    let Passport = config.passport.getPassport();
    let PassportUser = config.passport.getPassportUser();

    /*
     * We need to provide passport with a
     * way to serialize and deserialize
     * a Passport User.
     */
    passport.serializeUser((user, done) => done(null, user.id));

    passport.deserializeUser((id, done) => {
        return PassportUser.findOne(id).then(user => {
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
        let strategies = config.passport.strategies;

        let provider = _param(req, 'provider');
        let options = {};

        console.log('passport.endpoint: provider %s', provider);
        /*
         * We did not define the provider.
         */
        if(!strategies.hasOwnProperty(provider)){
            config.logger.warn('passport.endpoint: does not have provider %s', provider);
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
        let action = _param(req, 'action');
        let provider = _param(req, 'provider', 'local');

        if(action === 'disconnect'){
            if(req.user) return this.disconnect(req, res, next);
            next(new Error('Invalid action'));
        }

        if(provider === 'local'){
            if(action === 'register' && !req.user){
                return this.protocols.local.register(req, res, next);
            }

            if(action === 'connect' && req.user){
                return this.protocols.local.connect(req, res, next);
            }

            if(action === 'update' && req.user){
                //TODO: Need to make a better flow here.
                return this.protocols.local.update(req, res, next);
            }

            if(action === 'disconnect' && req.user){
                return this.protocols.local.disconnect(req, res, next);
            }

            next(new Error('Invalid action'));

        } else {
            if( action === 'disconnect' && req.user ){
                return this.disconnect(req, res, next);
            }

            this.authenticate(provider, next)(req, res, req.next);
        }
    };

    passport.connect = function(req, query, profile, next){
        let user = {};

        let provider = profile.provider || _param(req, 'provider');

        req.session.tokens = query.tokens;

        query.provider = provider;

        if(!provider){
            return next(new Error('No authentication provider was found.'));
        }

        config.logger.info('auth profile', profile);

        if(profile.emails && profile.emails[0]){
            user.email = profile.emails[0].value;
        }

        //TODO: Make filters!!
        if(config.passport.strategies[provider].restrictToDomain){
            if(!user.email) return false;
            var domain = user.email.split('@')[1];
            var hostedDomain = config.passport.strategies[provider].restrictToDomain;
            hostedDomain = hostedDomain.replace('www.', '');
            if(domain !== hostedDomain){
                return next({status: 401, message: 'Unauthorized domain.'});
            }
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
                /*
                 * An existing user is trying to log in using an
                 * already connected passport. Associate user to
                 * passport.
                 * TODO: Ensure we do a proper comparison of tokens
                 */
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
                    next(null, req.user);
                }).catch(next);
            }
            //not sure what's going on here. We do have a session.
            //Just pass it along...Back button?
            next(null, req.user);

        }).catch(next);
    };

    passport.disconnect = function(req, res, next){
        let user = req.user;
        let provider = _param(req, 'provider');

        return Passport.findOne({
            provider: provider,
            user: user.id
        }).then((record)=>{
            return PassportUser.destroy(record.id);
        }).then(()=>{
            next(null, user);
            return user;
        }).catch(next);
    };


    const loadStrategies = require('./strategies/loader');

    loadStrategies(passport, config.passport.strategies, config);

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
        /**
         * We want to only enable this to ppl we want to offer
         * a registration token.
         * A) Create token, send link with token
         * B) Check token vs database, if valid show
         * C) Send to token expired
         *
         * Render the registration page
         *
         * Just like the login form, the registration form is just simple HTML:
         *
        <form role="form" action="/auth/local/register" method="post">
          <input type="text" name="username" placeholder="Username">
          <input type="text" name="email" placeholder="Email">
          <input type="password" name="password" placeholder="Password">
          <button type="submit">Sign up</button>
        </form>
        *
        * @param {Object} req
        * @param {Object} res
        */
        register: function(req, res){

            let locals = {
                errors: res.flash('error')
            };

            res.render('register', locals);
        },
        /**
         * Render the login page
         *
         * The login form itself is just a simple HTML form:
         *
            <form role="form" action="/auth/local" method="post">
                <input type="text" name="identifier" placeholder="Username or Email">
                <input type="password" name="password" placeholder="Password">
                <button type="submit">Sign in</button>
            </form>
         *
         * You could optionally add CSRF-protection as outlined in the documentation:
         * http://sailsjs.org/#!documentation/config.csrf
         *
         * A simple example of automatically listing all available providers in a
         * Handlebars template would look like this:
         *
            {{#each providers}}
                <a href="/auth/{{slug}}" role="button">{{name}}</a>
            {{/each}}
         */
        login: function(req, res){
            let strategies = config.passport.strategies;
            let providers = {};

            Object.keys(strategies).map((key)=>{
                console.log('login: strategy key %s', key);
                if (key === 'local' || key === 'bearer') return;

                providers[key] = {
                    label: strategies[key].label,
                    slug: key
                };
                console.log('provider', providers[key]);
            });

            let locals = {
                providers,
                errors: res.flash('error')
            };

            res.render('login', locals);
        },
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
            let action = _param(req, 'action');
            console.log('AuthController:callback action %s', action);

            passport.callback(req, res, (err, user, info, status)=>{
                if(err || !user){
                    config.logger.warn(user, err, info, status);
                    return _negotiateError(res, err || info, action);
                }

                //TODO: Where do we apply filters?

                req.login(user, (err)=>{
                    if(err){
                        config.logger.warn('AuthController callback', err);
                        return _negotiateError(res, err, action);
                    }

                    req.session.authenticated = true;

                    res.locals.user = user;

                    config.logger.info('User authenticated OK %s', user);

                    if(req.query.next){
                        let url = _buildCallbacNextUrl(req);
                        res.status(302).set('Location', url);
                        return res.json(user);
                    }

                    res.redirect((req.session && req.session.returnTo) ? req.session.returnTo : '/');
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

    function getView(app, status, defaultView='error'){
        const path = require('path');
        const views = app.get('views');
        const ext = app.get('view engine');
        const exists = require('fs').existsSync;

        const view = path.join(views, status + '.' + ext);

        if(exists(view)) return view;

        if(app.parent) return getView(app.parent, status, defaultView);

        return defaultView;
    }

    function _negotiateError(res, err, action){
        if(action === 'register' || action === 'login'){
            return res.redirect('/' + action);
        } else if(action === 'disconnect'){
            return res.redirect('back');
        }

        console.log('----------........');
        console.log(err);
        console.log('----------........');
        //TODO: Need a way to inherit views!!
        //TODO: so myapp can reuse core views like
        //TODO: error, 401, 500, etc.
        res.status(403).format({
            html: function(){
                let view = getView(app, '401');
                res.render(view, {
                    message: err.message,
                    error: err
                });
            },
            json: function(){
                res.send({
                    message: err.message,
                    error: err
                });
            }
        });
    }

    function _buildCallbacNextUrl(req){
        const K = require('gkeypath');

        let url = K.get(req, 'query.next');
        let includeToken = req.query.includeToken;
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

    router.get('/login', AuthController.login);
    //TODO: config.routes.logout;
    router.get('/logout', AuthController.logout);

    /// THIS SHOULD BE OPTIONAL ////////////
    router.get('/register', AuthController.register);

    //This is equivalment to: /login
    router.post('/auth/local', AuthController.callback);
    router.post('/auth/local/:action', AuthController.callback);

    router.post('/auth/:provider', AuthController.callback);
    router.post('/auth/:provider/:action', AuthController.callback);

    router.get('/auth/:provider', AuthController.provider);
    router.get('/auth/:provider/callback', AuthController.callback);
    router.get('/auth/:provider/:action', AuthController.callback);

    // router.post('/signup', function(req, res){
    //     PassportUser.create(req.body).then((user)=>{
    //         res.flash('info', 'User ' + user.name + ' created.');
    //         res.redirect('/login');
    //     }).catch((err)=>{
    //         locals.user = req.body;
    //         res.render('signup', locals);
    //     });
    // });
    //////////////////////////////////////////
    /// LOAD STRATEGIES
    //////////////////////////////////////////
    /*
     * Default cleanUser function.
     */
/*
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
            user = user.toJSON();

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

        return PassportUser.findOne(query).then((user) => {
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
*/


    /*
     * Use all declared strategies
     */
    app.use('/', router);
};

module.exports.applyPolicies = require('./applyPolicies');

function _param(req, name, def){
    var body = req.body || {};
    var query = req.query || {};
    var params = req.params || {};

    if (null != params[name] && params.hasOwnProperty(name)) return params[name];
    if (null != body[name]) return body[name];
    if (null != query[name]) return query[name];

    return def;
}

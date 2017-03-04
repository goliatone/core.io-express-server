/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');

const Passport = require('./myapp/models/Passport');
const PassportUser = require('./myapp/models/PassportUser');

/*
 * This is a mock object providing
 * the minimun methods that context
 * should implement.
 */
let context = {
    getLogger: ()=> console,
    resolve: ()=> Promise.resolve(),
    hook: (e, configurator)=>{
        context['_server.pre'](configurator);
        return Promise.resolve();
    },
    on: (e, c)=>{
        console.log('context.on', e);
        context['_' + e] = c;
    },
    emit: (e, p)=>{
        console.log('context.emit', e);
    }
};

const initServer = require('..').init;
const initMyApp = require('..').initializeSubapp('myapp');


initMyApp(context, {
    mount: '/',
    moduleid: 'myapp',
    baseUrl: 'http://localhost:3000',
    locals: {
        title: 'MyApp Test',
        layout: 'layout'
    },
    passport: {
        /*
         * Model is an object which needs to
         * provide the following methods:
         * - findUserBy
         * - findUserById
         * - createUser
         * - cleanUser
         */
        getPassportUser: function(){
            return PassportUser;
        },
        getPassport: function(){
            return Passport;
        },
        strategies: {
            local: {
                protocol: 'local',
                strategy: require('passport-local').Strategy
            },
            bearer: {
                strategy: require('passport-http-bearer').Strategy,
                protocol: 'bearer'
            },
            google: {
                label: 'Google',
                protocol: 'oauth2',
                strategy: require('passport-google-oauth20').Strategy,
                // restrictToDomain: 'peperone.com',
                options: {
                    clientID: process.env.NODE_GOOGLE_CLIENT_ID || 'none',
                    clientSecret: process.env.NODE_GOOGLE_CLIENT_SECRET || 'none',
                    callbackURL: process.env.NODE_CLIENT_BASE_URL + '/auth/google/callback',
                    scope: ['profile', 'email']
                }
            }
        }
    },
    policies: {
        'GET /profile': [
            require('./myapp/middleware/isAuthenticated')
        ],
    },

    middleware: {
        passport: require('core.io-express-auth'),
        /*
         * This actually indicates which middleware
         * to use.
         */
        use: [
            'poweredBy',
            'compression',
            'viewEngine',
            'logger',
            'favicon',
            'bodyParser',
            'cookieParser',
            'session',
            // 'isAuthenticated',
            'flash',
            'passport',
            'expressStatic',
            'expressLayouts',
            'appVariables',
            'routes',
            'locals'
        ]
    }
});

initServer(context, {
    port: 3000
});

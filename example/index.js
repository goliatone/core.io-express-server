/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');

const PassportModel = require('./myapp/models/PassportUser');

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
const initMyApp = require('..').initializeSubapp('root');


initMyApp(context, {
    mount: '/',
    moduleid: 'myapp',
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
        model: PassportModel,
        strategies: {
            google:{}
        }
    },
    policies: {
        'GET /profile': [
            require('./myapp/middleware/isAuthenticated')
        ],
    },

    middleware: {
        passport: require('./myapp/middleware/core.io-auth'),
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

initServer(context, {});

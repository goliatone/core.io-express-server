'use strict';

const Server = require('..').init;

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

const MyApp = require('..').initializeSubapp('root');

MyApp(context, {
    moduleid: 'myapp',
    basedir: './myapp',
    mount: '/',
    routes: {
        path: ['./myapp/routes']
    },
    locals: {
        title: 'MyApp Test'
    },
    passport: {
        findUserById: function(id){
            return Promise.resolve({
                id: 1,
                email: 'hello@goliatone.com'
            });
        }
    },
    middleware: {
        isAuthenticated: require('./myapp/middleware/isAuthenticated'),
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
            'isAuthenticated',
            'passport',
            'flash',
            'expressStatic',
            'expressLayouts',
            'appVariables',
            'routes',
            'locals'
        ]
    }
});

Server(context, {});

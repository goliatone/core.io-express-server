'use strict';
const extend = require('gextend');
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

let _data = {
    _i: 1,
    1: {
        id: 1,
        email: 'hello@goliatone.com'
    }
};

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
            return Promise.resolve(_data[id]);
        },
        findUserBy: function(prop, val){
            return Promise.resolve(_data[2]);
        },
        createUser: function(user){
            console.log('createUser', JSON.stringify(user, null, 4));

            const cryptoUtils = require('./myapp/middleware/core.io-auth/cryptoUtils');
            ++_data._i;
            let i = _data._i;
            user.id = i;
            _data[i] = user;

            return cryptoUtils.hash(user).then((user)=>{
                console.log('Added user:', user);
                console.log(Object.keys(_data));
                return user;
            });
        },
        cleanUser: function(user){
            let clone = extend({}, user);
            delete clone.password;
            return clone;
        }
    },
    policies: {
        'GET /hello': [
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

Server(context, {});

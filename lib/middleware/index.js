'use strict';

/*************************************************************
 * MIDDLEWARE
 ************************************************************/

module.exports.use = {
    poweredBy: require('./poweredBy'),
    compression: require('./compression'),
    livereload: require('./livereload'),
    viewEngine: require('./viewEngine'),
    logger: require('./logger'),
    favicon: require('./favicon'),
    bodyParser: require('./bodyParser'),
    cookieParser: require('./cookieParser'),
    session: require('./session'),
    passport: require('./passport'),
    flash: require('./flash'),
    expressStatic: require('./expressStatic'),
    expressLayouts: require('./expressLayouts'),
    appVariables: require('./appVariables'),
    routes: require('./routes'),
    locals: require('./locals'),
};

module.exports.order = [
    'poweredBy',
    'compression',
    'livereload',
    'viewEngine',
    'logger',
    'favicon',
    'bodyParser',
    'cookieParser',
    'session',
    'passport',
    'flash',
    'expressStatic',
    'expressLayouts',
    'appVariables',
    'routes',
    'locals'
];

module.exports.dependencies = [
    'trackfinder',
    'compression',
    'serve-favicon',
    'body-parser',
    'cookie-parser',
    'passport',
    'express-session',
    'express-ejs-layouts',
    'morgan',
    'ejs',
    'express-flash-2'
];

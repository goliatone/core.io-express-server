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
    passport: require('./passport'),
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
    'passport',
    'expressStatic',
    'expressLayouts',
    'appVariables',
    'routes',
    'locals'
];

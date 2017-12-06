'use strict';

/*************************************************************
 * MIDDLEWARE
 ************************************************************/
//TODO: Load all files in this dir that are not index.js
//TODO: Load all files in any passed source directory.

let middleware = {
    poweredBy: require('./poweredBy'),
    compression: require('./compression'),
    // livereload: require('./livereload'),
    viewEngine: require('./viewEngine'),
    logger: require('./logger'),
    //TODO: cors support
    cors: require('./cors'),
    favicon: require('./favicon'),
    bodyParser: require('./bodyParser'),
    cookieParser: require('./cookieParser'),
    session: require('./session'),
    csrf: require('./csrf'),
    passport: require('./passport'),
    flash: require('./flash'),
    expressStatic: require('./expressStatic'),
    expressLayouts: require('./expressLayouts'),
    requestId: require('./requestId'),
    appVariables: require('./appVariables'),
    routes: require('./routes'),
    locals: require('./locals'),
    fileUpload: require('./fileUpload')
};

middleware.use = [
    'poweredBy',
    'compression',
    'viewEngine',
    'favicon',
    // 'cookieParser',
    'cors',
    /*
     * If you register static middleware after
     * the sesson middleware you will be
     * generating sessions for each static
     * file, i.e css/img/font/etc.
     */
    'expressStatic',
    'logger',
    'requestId',
    'bodyParser',
    'session', //This must be before passport!!
    // 'livereload',
    'expressLayouts',
    'flash',
    'passport',
    'csrf',
    'appVariables',
    'routes',
    'locals',
    'fileUpload'
];

middleware.dependencies = [
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
    'express-flash-2',
    'csurf',
    'skipper'
];

module.exports = middleware;

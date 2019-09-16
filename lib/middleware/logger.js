/*jshint esversion:6, node:true*/
'use strict';
const extend = require('gextend');

const defaults = {
    logger: {
        disableInProd: true
    }
};

let applied = false;

/**
 * TODO: Ensure configuration makes sense.
 * 
 * @param {Express} app Express application
 * @param {Object} config Config options
 */
module.exports = function logger(app, config) {

    if (applied) return;

    let isProd = app.get('env') === 'production';

    config = extend({}, defaults, config);

    if (isProd && config.logger.disableInProd) {
        return;
    }
    //this prevents to have multiple loggers applied per app.
    applied = true;

    /*
     * Predefined Formats:
     * - combined: :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"
     * - common:  :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]
     * - dev: :method :url :status :response-time ms - :res[content-length]
     * - short: :remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms
     * - tiny: :method :url :status :res[content-length] - :response-time ms
     */
    let options = {
        format: 'dev'
    };

    //This does not make sense. We might have a logger 
    //in the top level config object, but not as an object.
    if (config.logger.format) {
        options.format = config.logger.format;
    } else if (isProd) {
        options.format = 'combined';
    }

    if (config.logger) {
        var logger = config.logger;
        options.stream = {
            write: function $write(message = '') {
                logger.info(message.trim());
            }
        };
    }

    /*
     * Expose a `logger` property to
     * requests.
     */
    app.use(function addLogger(req, res, next) {
        req.logger = logger;
        next();
    });

    const _logger = require('morgan');

    app.use(_logger('dev', options));

};

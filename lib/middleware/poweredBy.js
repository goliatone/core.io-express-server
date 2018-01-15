'use strict';
const extend = require('gextend');

const defaults = {
    poweredBy: 'CoreIO <core.io>'
};

/**
 * The configuration object will be the module's
 * configuration object.
 * We probably want to create an entry for this
 * specific middleware...
 * 
 * @param {Express} app Express application
 * @param {Object} config Configuration object
 */
function poweredBy(app, config) {
    
    config = extend({}, defaults, config);

    if(config.disablePoweredBy) {
        return app.disable('x-powered-by');
    }

    if(config.poweredBy === false) {
        return;
    }

    app.use(function xPoweredBy(req, res, next) {
        res.header('x-powered-by', config.poweredBy);
        next();
    });
}

module.exports = poweredBy;

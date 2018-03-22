'use strict';
const extend = require('gextend');

const DEFAULTS = {
    // bodyParser.urlencoded
    extended: true, 
    // json body parser
    limit: '1mb',
    //multiperbody parser
    maxTimeToBuffer: 4500,
    maxTimeToWaitForFirstFile: 10000,
    maxWaitTimeBeforePassingControlToApp: 500
};

/**
 * Handle uploads.
 * @param {Express} app Express app
 * @param {Object} config Configuration options
 */
module.exports = function favicon(app, config) {
    
    app.use(require('skipper')());
};

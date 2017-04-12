'use strict';

const Keypath = require('gkeypath');

/**
 * Configure `passport` middleware for this
 * express module app.
 *
 * "config" here is the whole object for this
 * module's configuration.
 *
 * @method exports
 * @param  {Object} app    Express app or router.
 * @param  {Object} config Configuration object.
 * @return {void}
 */
module.exports = function passport(app, config) {

    const session = require('express-session');

    config.logger.info('-> middleware: moduleid %j', config.moduleid);

    let resave = Keypath.get(config, 'session.store', {}).touch === undefined;

    let defaults = {
        secret: generate(),
        /*
         * If we hvae multiple sub-apps
         * they could potentially all use
         * default name.
         */
        name: app.get('appName') || 'core.io',
        /*
         * If the used store supports the `touch` method
         * we can set this to false.
         * connect-sqlite3 does NOT support touch.
         */
        resave: resave,
        httpOnly: false,
        saveUninitialized: true,
        cookie: {
            /*
             * This should be set to true.
             */
            secure: false,
            maxAge: 6000000
        }
    };

    let options = config.session || defaults;

    if(resave === false && options.resave) {
        config.logger.warn('session.resave = true but your store does not support "touch"');
        config.logger.warn('Are you sure this is what you intend?');
    }

    config.logger.info('-> middleware: session %j', options);

    let cpInstance = options.copySessionInstance;
    delete options.copySessionInstance;

    let sessionInstance = session(options);

    if(cpInstance) {
        if(typeof cpInstance === 'function') {
            cpInstance(sessionInstance, app, config);
        }

        if(typeof cpInstance === 'string') {
            options[cpInstance] = sessionInstance;
        }
    }

    app.use(sessionInstance);
};

function generate(length = 25) {
    const crypto = require('crypto');
    let buffer = crypto.randomBytes(length);
    return buffer.toString('hex');
}

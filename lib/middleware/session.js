'use strict';

module.exports = function passport(app, config){

    const session = require('express-session');

    config.logger.info('-> middleware: moduleid %j', config.moduleid);

    let defaults = {
        secret: generate(),
        name: app.get('appName') || 'core.io',
        resave: true,
        httpOnly: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            maxAge: 6000000
        }
    };

    let options = config.session || defaults;

    config.logger.info('-> middleware: session %j', options);

    app.use(session(options));
};

function generate(length=25){
    const crypto = require('crypto');
    let buffer = crypto.randomBytes(length);
    return buffer.toString('hex');
}

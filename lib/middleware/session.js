'use strict';

module.exports = function passport(app, config){

    const session = require('express-session');

    app.use(session(config.session || {
        secret: generate(),
        resave: true,
        saveUninitialized: true
    }));
};

function generate(length=25){
    const crypto = require('crypto');
    let buffer = crypto.randomBytes(length);
    return buffer.toString('hex');
}

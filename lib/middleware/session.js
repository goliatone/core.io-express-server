'use strict';

module.exports = function passport(app, config){
    
    const session = require('express-session');

    app.use(session(config.session || {
        secret: 'keyboard cat',
        resave: true,
        saveUninitialized: true
    }));
};

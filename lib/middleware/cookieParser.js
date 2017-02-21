'use strict';

module.exports = function cookieParser(app, config){
    const _cookieParser = require('cookie-parser');
    app.use(_cookieParser());
};

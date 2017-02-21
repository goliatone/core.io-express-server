'use strict';

module.exports = function bodyParser(app, config){
    const _bodyParser = require('body-parser');
    app.use(_bodyParser.json());
    app.use(_bodyParser.urlencoded({ extended: false }));
};

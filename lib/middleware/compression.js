'use strict';

module.exports = function compression(app, config){
    const compression = require('compression');
    app.use(compression());
};

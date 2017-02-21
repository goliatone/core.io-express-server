'use strict';

module.exports = function viewEngine(app, config){
    const path = require('path');
    console.log('views', path.join(config.basedir, 'views'));
    app.set('views', path.join(config.basedir, 'views'));
    app.set('view engine', 'ejs');
};

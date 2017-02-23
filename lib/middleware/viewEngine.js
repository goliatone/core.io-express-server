'use strict';

module.exports = function viewEngine(app, config){
    if(!config.logger) config.logger = console;

    const path = require('path');

    config.logger.info('viewEngine: views path "%s"', path.join(config.basedir, 'views'));

    app.set('views', path.join(config.basedir, 'views'));
    app.set('view engine', 'ejs');
};

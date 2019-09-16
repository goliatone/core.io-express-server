'use strict';
const path = require('path');

module.exports = function viewEngine(app, config) {
    if (!config.logger) config.logger = console;

    if (!config.moduleDir) {
        config.logger.warn('viewEngine: we did not specify a "moduleDir".');
        config.logger.warn('Things might go wrong...');
    }


    if (!config.viewsPath) {
        config.viewsPath = path.join(config.moduleDir, 'views');
    }

    if (!config.viewsExt) {
        config.viewsExt = 'ejs';
    }

    config.logger.info('=------------------------');
    config.logger.info('viewEngine: views path "%s"', config.viewsPath);
    config.logger.info('=------------------------');

    app.set('views', config.viewsPath);
    app.set('view engine', config.viewsExt);
};

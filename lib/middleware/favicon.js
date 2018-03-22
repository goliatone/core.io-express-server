'use strict';

const favicon = require('serve-favicon');
const exists = require('fs').existsSync;

module.exports = function $favicon(app, config) { 
    if(!config.logger) config.logger = console;

    if(!exists(config.faviconPath)){
        config.logger.warn('favicon: The provided path %s does not exist.', config.faviconPath);
        return;
    }

    app.use(favicon(config.faviconPath));
};

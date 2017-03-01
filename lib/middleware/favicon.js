'use strict';

const path = require('path');
const fav = require('serve-favicon');
const exists = require('fs').existsSync;

module.exports = function favicon(app, config){
    if(!config.logger) config.logger = console;

    let parent = path.resolve(__dirname, '../..');
    let favipath = path.join(parent, 'public/favicon.ico');

    if(config.faviconPath) favipath = config.faviconPath;

    if(!exists(favipath)){
        config.logger.warn('favicon: The provided path %s does not exist.', favipath);
        return;
    }

    app.use(fav(favipath));
};

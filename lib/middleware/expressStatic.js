'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');

/*
 * Ideally you would not be serving this from your
 * application, i.e have nginex or a cdn serving
 * your assets. However, for development its fine.
 */
module.exports = function expressStatic(app, config) {
    if(!config.logger) config.logger = console;

    if(!config.basepath){
        config.logger.warn('viewEngine: we did not specify a "basepath".');
        config.logger.warn('Things might go wrong...');
    }

    if(!config.publicDirName) {
        config.publicDirName = 'public';
    }

    if(!config.publicPath) {
        config.publicPath = path.join(config.basepath, config.publicDirName);
    }

    if(!fs.existsSync(config.publicPath)) {
        return config.logger.warn('viewEngine: specified "publicPath" does not exist.');
    } 

    //TODO: Move this to it's own router and module
    config.logger.info('static', config.publicPath);

    app.use(express.static(config.publicPath));
};

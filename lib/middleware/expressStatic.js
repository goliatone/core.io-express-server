'use strict';

/*
 * Ideally you would not be serving this from your
 * application, i.e have nginex or a cdn serving
 * your assets. However, for development its fine.
 */
module.exports = function expressStatic(app, config){
    if(!config.logger) config.logger = console;

    if(!config.basedir){
        config.logger.warn('viewEngine: we did not specify a "basedir".');
        config.logger.warn('Things might go wrong...');
    }

    const path = require('path');
    const express = require('express');

    //TODO: Move this to it's own router and module
    config.logger.info('static', path.join(config.basedir, 'public'));

    app.use(express.static(path.join(config.basedir, 'public')));
};

'use strict';

module.exports = function expressStatic(app, config){
    if(!config.logger) config.logger = console;

    const path = require('path');
    const express = require('express');

    //TODO: Move this to it's own router and module
    config.logger.info('static', path.join(config.basedir, 'public'));
    
    app.use(express.static(path.join(config.basedir, 'public')));
};

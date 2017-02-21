'use strict';

module.exports = function expressStatic(app, config){
    const path = require('path');
    const express = require('express');
    //TODO: Move this to it's own router and module
    console.log('static', path.join(config.basedir, 'public'));
    app.use(express.static(path.join(config.basedir, 'public')));
};

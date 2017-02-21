'use strict';

const path = require('path');
const fav = require('serve-favicon');

module.exports = function favicon(app, config){
    let parent = path.resolve(__dirname, '..');
    let favipath = path.join(parent, 'public/favicon.ico');
    if(config.faviconPath) favipath = config.faviconPath;
    app.use(fav(favipath));
};

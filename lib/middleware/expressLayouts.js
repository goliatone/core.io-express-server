'use strict';

module.exports = function expressLayouts(app, config){
    const _expressLayouts = require('express-ejs-layouts');
    app.use(_expressLayouts);
    app.set('layout extractMetas', true); //extract meta tags and place on meta block
    app.set('layout extractStyles', true); //extract style tags and place on style block
    app.set('layout extractScripts', true); //extract scripts tags and place on script block
};
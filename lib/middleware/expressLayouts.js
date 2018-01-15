'use strict';

module.exports = function $expressLayouts(app, config) {
    const expressLayouts = require('express-ejs-layouts');

    app.use(expressLayouts);

    /*
     * extract meta tags and place on meta block
     */
    app.set('layout extractMetas', true);
    /*
     * extract style tags and place on style block
     */
    app.set('layout extractStyles', true);
    /*
     * extract scripts tags and place on script block
     */
    app.set('layout extractScripts', true);
};

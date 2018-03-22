'use strict';

module.exports = function passport(app, config) {
    /*
     * Initialize session passport
     * We should be able to move this to the
     * auth submodule and pull from there.
     */
    const _passport = require('passport');

    app.use(_passport.initialize());

    app.use(_passport.session());
};

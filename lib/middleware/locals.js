'use strict';

/**
 * Add local variables to express app.
 * Variables are global and defined during
 * configuration. 
 * 
 * Useful for things like keywords or things
 * that do not change request by request.
 * 
 * @param {Experss} app Express app
 * @param {Object} config Configuration object
 */
module.exports = function locals(app, config) {

    Object.keys(config.locals || {}).map((key)=>{
        app.locals[key] = config.locals[key];
    });

    app.locals.ENV = app.get('env');
};

/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');

var DEFAULTS = {
    middleware: require('./middleware')
};

module.exports = function(options) {

    return {
        init: function(context, config) {

            config = extend({}, options, config);
            const express = require('express');
            var app = express();

            /*
             * Enable middleware to use context,
             * i.e. to publish an event system wide.
             * context.emit('web.request.createUser', user);
             */
            config.context = context;

            /*
             * Create a logger for our express app.
             * This can be trickled down to middleware
             * as well.
             */
            config.logger = context.getLogger(config.moduleid);

            //TODO: This should be pulled out of here and implmented by
            //configurator.
            setup(app, config);

            return app;
        }
    };
};

function setup(app, config) {

    config = extend({}, DEFAULTS, config);

    //TODO: Should we have policies & middleware?

    var middleware = config.middleware;

    var use = config.middleware.use;

    use.map((id) => {
        if (!middleware.hasOwnProperty(id)) {
            missingMiddleware(config, id);
        }
        middleware[id](app, config);
    });

    /*
     * Make sub app aware of it's own
     * module id.
     */
    app.appId = config.moduleid;
}

function missingMiddleware(config, middleware) {
    let message = 'Sub app "' + config.moduleid + '" has no middleware "' + middleware + '"';
    throw new Error(message);
}

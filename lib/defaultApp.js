/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');

var DEFAULTS = {
    middleware: {
        use:   require('./middleware').use,
        order: require('./middleware').order,
    }
};

module.exports.init = function(context, config){

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
    config.logger = context.getLogger(config.name);

    /*
     * basedir will be used by middleware to
     * find the `public` directory, `views`,
     * etc...
     */
    config.basedir = __dirname;

    setup(app, config);

    return app;
};

function setup(app, config){

    config = extend({}, DEFAULTS, config);

    var use = config.middleware.use;

    var order = config.middleware.order;

    order.map((middleware)=>{
        use[middleware](app, config);
    });
}
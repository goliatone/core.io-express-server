/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');

var DEFAULTS = {
    middleware: {
        use:   require('./middleware').use,
        order: require('./middleware').order,
    }
};

module.exports.init = function(options){

    return function(context, config){

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
        config.logger = context.getLogger(config.name);

        /*
         * basedir will be used by middleware to
         * find the `public` directory, `views`,
         * etc...
         */
        if(!config.basedir){
            config.basedir = require('path').dirname(module.parent.filename);
            config.logger.warn('You did not specify a "basedir"?');
            config.logger.warn('We are making a guess: %s', config.basedir);
        } else {
            config.logger.warn('Loading views and assets from: %s', config.basedir);
        }

        setup(app, config);

        return app;
    };
};

function setup(app, config){

    config = extend({}, DEFAULTS, config);

    var use = config.middleware.use;

    var order = config.middleware.order;

    order.map((middleware)=>{
        use[middleware](app, config);
    });
}

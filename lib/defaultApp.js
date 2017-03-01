/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');

var DEFAULTS = {
    middleware: require('./middleware')
};

module.exports = function(options){

    return {
        init: function(context, config){

            config = extend({}, options, config);
            console.log('-------- defaultApp -----');
            console.log(JSON.stringify(config, null, 4));
            console.log('-------------------------------');
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

             /*
              * basedir will be used by middleware to
              * find the `public` directory, `views`,
              * etc...
              */
            if(!config.basedir){

                if(!config.hasOwnProperty('moduleid')){
                    throw new Error('You need to specify "config.basedir". Else set "config.moduleid" so we can guess.');
                }

                let sep = require('path').sep;
                config.basedir = [context.modulespath, config.moduleid].join(sep);

                config.logger.warn('You did not specify a "basedir"?');
                config.logger.warn('We are making a guess: %s', config.basedir);
            } else {
                config.logger.warn('Loading views and assets from: %s', config.basedir);
            }

            setup(app, config);

            return app;
        }
    };
};

function setup(app, config){

    config = extend({}, DEFAULTS, config);

    //TODO: Should we have policies & middleware?

    var middleware = config.middleware;

    var use = config.middleware.use;

    use.map((id)=>{
        if(!middleware.hasOwnProperty(id)){
            missingMiddleware(config, id);
        }
        middleware[id](app, config);
    });
}

function missingMiddleware(config, middleware){
    let message = 'Sub app "' + config.moduleid + '" has no middleware "' + middleware + '"';
    throw new Error(message);
}

'use strict';

module.exports = function routes(app, config){
    const TrackFinder = require('trackfinder');

    TrackFinder.register(app, {
        config: config,
        path: config.routes.path,
        logger: config.logger
    });
};

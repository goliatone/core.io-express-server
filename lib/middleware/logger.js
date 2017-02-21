'use strict';

module.exports = function logger(app, config){
    var options = {
        format: 'dev'
    };

    if(config.logger){
        var winston = config.logger;
        options.stream = {
            write: function(message=''){
                winston.info(message.trim());
            }
        };
    }

    const _logger = require('morgan');

    app.use( _logger('dev', options));
};

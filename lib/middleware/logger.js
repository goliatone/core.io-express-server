'use strict';

module.exports = function logger(app, config){
    /*
     * Predefined Formats:
     * - combined: :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"
     * - common:  :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]
     * - dev: :method :url :status :response-time ms - :res[content-length]
     * - short: :remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms
     * - tiny: :method :url :status :res[content-length] - :response-time ms
     */
    var options = {
        format: 'dev'
    };

    if(config.logger.format) {
        options.format = config.logger.format;
    } else if(app.get('env') === 'production'){
        options.format = 'combined';
    }

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

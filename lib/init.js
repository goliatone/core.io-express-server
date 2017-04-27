/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');
const Server = require('./server');
const  Configurator = require('./configurator');

const DEFAULTS = {
    dependencies: []
};

module.exports = function(context, config) {
    config = extend({}, DEFAULTS, config);

    context.getLogger('server').info('Loading server module...');

    if (!config.context) config.context = context;
    if (!config.dispatcher) config.dispatcher = context;

    return new Promise((resolve, reject) => {

        context.resolve(config.dependencies).then(() => {

            context.getLogger('server').info('Persistence ready...');

            config.logger = context.getLogger('server');

            let server = Server.createServer(config);

            let configurator = new Configurator(config);

            context.hook('server', configurator).then((data) => {
                server.start().on('server.ready', (server) => {
                    context.getLogger('server').info('server ready!!');
                    resolve(server);
                });
            }).catch((err) => {
                context.getLogger('server').error(err);
                reject(err);
            });
        }).catch((err) => {
            context.getLogger('server').error(err);
            reject(err);
        });
    });
};

module.exports.DEFAULTS = DEFAULTS;

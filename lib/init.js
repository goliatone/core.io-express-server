/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');
const Server = require('./server');
const  Configurator = require('./configurator');

const DEFAULTS = {
    dependencies: []
};

/**
 * 
 * Flow:
 * 
 * 1) Application registers all modules, server and
 * sub-applications in whatever (order is potentially 
 * unknown)
 * 
 * 2) Server waits for dependencies. If our **config/server.js**
 * config file specifies a dependencies array, the server will
 * wait for those modules to be ready before starting itself.
 * For the time being, sub applications should list their deps
 * in the server entry.
 * 
 * 3) Sub apps wait for "server.pre" hook to initialize.
 * The "server" hook sends the configuration instance to
 * each sub application. Each sub application uses this
 * instance to get configuration defaults and to register
 * itself with the main app:
 *   - calls `configurator.addSubappDefaults` to ensure config defaults.
 *   - calls SubApp.init.
 *   - calls `configurator.mount` to add a reference to itself.
 * 
 * 4) server hook is done. We call `server.start`:
 * This creates the main server application, and starts
 * setup process:
 *   - add middleware
 *   - add views
 *   - mount sub apps: At this point sub apps have already 
 *     been created. It also extends sub apps with some convenience
 *     functions like getRoot and addViewPath. This can't not be 
 *     used before subapp is mounted.
 *   - add routes
 *   - add error handlers
 *   - create http server and listen
 * 
 * @param {Application} context coreio application
 * @param {Object} config Configuration object
 */
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

            /**
             * Find a server sub-app.
             * @method findServerSubApp
             * @param  {String}         moduleId Sub-app id
             * @return {Promise}
             */
            // context.provide('findServerSubApp', function(moduleId){});
            context.findServerSubApp = function(moduleId) {
                return context.resolve(config.moduleid).then((server) => {
                    return server.findSubapp(moduleId);
                });
            };

        }).catch((err) => {
            context.getLogger('server').error(err);
            reject(err);
        });
    });
};

module.exports.DEFAULTS = DEFAULTS;

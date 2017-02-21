/*jshint esversion:6, node:true*/
'use strict';

/**
 * Module initializer.
 */
module.exports.init = require('./lib/init');

/**
 * Utils
 */
module.exports.utils = require('./lib/utils');

/**
 * Class helps with Setup.
 */
module.exports.Setup = require('./lib/setup');

/**
 * Server Class
 */
module.exports.Server = require('./lib/server');
/**
 * Configurator class.
 */
module.exports.Configurator = require('./lib/configurator');
/**
 * initializer for express sub apps.
 */
module.exports.initializeSubapp = require('./lib/initializeSubapp');
/**
 * createServer
 * @method createServer
 * @param  {Object}     config
 * @return {Object}     Server instance.
 */
module.exports.createServer = function(config){
    let Server = module.exports.Server;
    var instance = new Server(config);
    return instance;
};

/*jshint esversion:6, node:true*/
'use strict';

module.exports.init = require('./lib/init');
module.exports.utils = require('./lib/utils');
module.exports.Setup = require('./lib/setup');
module.exports.Server = require('./lib/server');
module.exports.Configurator = require('./lib/configurator');

module.exports.createServer = function(config){
    let Server = module.exports.Server;
    var instance = new Server(config);
    return instance;
};

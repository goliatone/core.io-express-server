/*jshint esversion:6, node:true*/
'use strict';

var Server = require('./server');
var Configurator = require('./configurator');

module.exports = function(context, config){

    context.getLogger('server').info('Loading server module...');

    if(!config.context) config.context = context;
    if(!config.dispatcher) config.dispatcher = context;

    return new Promise((resolve, reject)=>{

        context.resolve('persistence').then(()=>{

            context.getLogger('server').info('Persistence ready...');

            config.logger = context.getLogger('server');

            var server = Server.createServer(config);

            var configurator = new Configurator(config);

            context.hook('server', configurator).then((data)=>{
                server.start().on('server.ready', (server)=>{
                    context.getLogger('server').info('server ready!!');
                    resolve(server);
                });
            }).catch((err)=>{
                context.getLogger('server').error(err);
                reject(err);
            });
        }).catch((err)=>{
            context.getLogger('server').error(err);
            reject(err);
        });
    });
};

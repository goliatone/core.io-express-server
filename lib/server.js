/*jshint esversion:6, node:true*/
'use strict';

const express = require('express');
const EventEmitter = require('events');
const path = require('path');
/**
 * Module dependencies.
 */
const http = require('http');
const Setup = require('./setup');
const getPort = require('./utils').getPort;

/**
 * Listen on provided port, on all network interfaces.
 */
class Server extends EventEmitter {

    constructor(config){
        super();
        this.logger = config.logger || console;
        this.config = config;
    }

    start(opt){
        let app = express();

        var setup = new Setup(app, this.config);
        setup.logger = this.logger;

        this.express = setup.express;

        setup.addMiddleware();

        setup.addViews();

        // this.once('server.routes', setup.addRoutes.bind(setup));
        // this.once('server.error-handlers', setup.addErrorHandlers.bind(setup));
        setup.mount();

        setup.addErrorHandlers();

        this.emit('server.pre-routes');
        this.emit('server.routes');
        this.emit('server.post-routes');

        this.emit('server.pre-error-handlers');
        this.emit('server.error-handlers');
        this.emit('server.post-error-handlers');

        /**
         * Get port from environment and store in Express.
         */
        const port = getPort();
        this.server = setup.createServer(port);

        this.server.on('error', this.onError.bind(this));
        this.server.on('listening', this.onReady.bind(this));

        return this;
    }

    get transport(){ return this.server; }

    get serverApp(){ return this.express; }

    /**
     * Event listener for HTTP server "listening" event.
     */
    onReady(){

        var addr = this.server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;

        this.logger.info('Listening on ' + bind);

        this.emit('server.ready', this);
    }

    /**
     * Event listener for HTTP server "error" event.
     */
    onError(error){
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }
}

module.exports = Server;
module.exports.createServer = function(config){
    var instance = new Server(config);
    return instance;
};

/*jshint esversion:6, node:true*/
'use strict';

const express = require('express');
const EventEmitter = require('events');
const path = require('path');
const listEndpoints = require('express-list-endpoints');
/**
 * Module dependencies.
 */
const http = require('http');
const Setup = require('./setup');

/**
 * Listen on provided port, on all network interfaces.
 */
class Server extends EventEmitter {

    constructor(config) {
        super();
        this.logger = config.logger || console;
        this.config = config;
    }

    start(opt) {

        //@TODO: Move to setup?
        let app = express();
        app.set('appId', 'core');

        var setup = new Setup(app, this.config);
        setup.logger = this.logger;

        //@TODO: I think we meant to pass app, not express.
        this.express = setup.express;
        this.express = app;

        // setup.addRoutes();

        setup.addMiddleware();

        setup.addViews();

        this.once('server.routes', setup.addRoutes.bind(setup));
        // this.once('server.error-handlers', setup.addErrorHandlers.bind(setup));
        setup.mount();

        /**
         * You define error-handling middleware last,
         * after other app.use and routes calls.
         */
        this.once('server.error-handlers', setup.addErrorHandlers.bind(setup));

        this.emit('server.pre-routes');
        this.emit('server.routes');
        this.emit('server.post-routes');

        this.emit('server.pre-error-handlers');
        this.emit('server.error-handlers');
        this.emit('server.post-error-handlers');

        /**
         * Get port from environment and store in Express.
         */
        const port = this.config.port;
        this.server = setup.createServer(port);

        this.server.on('error', this.onError.bind(this));
        this.server.on('listening', this.onReady.bind(this));

        return this;
    }

    /**
     * Find a sub application by module name.
     * @method findSubapp
     * @param  {String}   id Application name
     * @return {Promise}
     */
    findSubapp(id) {
        return new Promise((resolve, reject) => {
            let app = this.config.mountedApps[id];
            if(app) return resolve(app);
            /*
             * Usually we would call this after
             * we have throuhg the mount process.
             * We are not waiting for them to be
             * mounted, just to be defined and
             * registered.
             */
            reject();
        });
    }

    /**
     * Find a sub application by route.
     * @method findSubappByRoute
     * @param  {String}          route
     * @return {Promise}
     */
    findSubappByRoute(route) {
        return new Promise((resolve, reject) => {
            let app = this.config.subapps[route];
            if(app) return resolve(app);
            reject();
        });
    }

    /**
     * Returns an array with the list of
     * all routes for a given sub application.
     * @param  {String} id App id
     * @return {Promise}
     */
    listRoutesForSubapp(id){
        return this.findSubapp(id).then((app)=>{
            return listEndpoints(app);
        });
    }

    get transport() {
        return this.server;
    }

    get serverApp() {
        return this.express;
    }

    /**
     * Event listener for HTTP server "listening" event.
     */
    onReady() {

        var addr = this.server.address();

        var bind = _isString(addr) ? 'pipe ' + addr : 'port ' + addr.port;

        this.logger.info('Listening on %s.', bind, {
            __meta__: {
                style: 'bold+white+magenta_bg'
            }
        });

        this.emit('server.ready', this);
    }

    /**
     * Event listener for HTTP server "error" event.
     */
    onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        let port = this.serverApp.get('port');

        var bind = (_isString(port) ? 'Pipe ' : 'Port ') + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                this.logger.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                this.logger.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }
}

function _isString(str) {
    return typeof str === 'string';
}

module.exports = Server;

module.exports.createServer = function(config) {
    var instance = new Server(config);
    return instance;
};

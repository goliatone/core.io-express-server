/*jshint esversion:6, node:true*/
'use strict';

const path = require('path');
const express = require('express');


const TrackFinder = require('trackfinder');

class Setup {
    constructor(app, config){
        this.app = app;
        this.config = config;
    }

    addRoutes(){
        this.logger.info('Scanning routes...');
        //Wire routes:

        TrackFinder.register(this.app, {
            path: this.config.routesPath,
            config: this.config,
            logger: this.logger
        });
    }

    addMiddleware(){
        let app = this.app;
        let config = this.config;

        const fav = require('serve-favicon');
        let favipath = path.join(__dirname, '../public/favicon.ico');
        if(config.faviconPath) favipath = config.faviconPath;
        app.use(fav(favipath));
    }

    addViews(){
        let app = this.app;
        /*
         * We handle errors, which means we need
         * to be able to render views...
         */
        app.set('views', path.join(__dirname, 'views'));
        app.set('view engine', 'ejs');
    }

    mount(){
        var apps = this.config.subapps;
        var router;
        Object.keys(apps).map((route)=> {
            router = apps[route];
            this.logger.info('mount app: %s', route);
            this.app.use(route, router);
        });
    }

    addErrorHandlers(){
        let app = this.app;

        // catch 404 and forward to error handler
        app.use(function(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // error handlers

        // development error handler
        // will print stacktrace
        if (app.get('env') === 'development') {
            app.use(function(err, req, res, next) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
        }

        // production error handler
        // no stacktraces leaked to user
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
            });
        });
    }

    get express() { return this.app; }

    createServer(port){
        this.app.set('port', port || '3000');

        var http = require('http');
        this.server = http.createServer(this.app);

        this.server.on('clientError', (err, socket) => {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });

        this.server.listen(port);

        return this.server;
    }
}

module.exports = Setup;

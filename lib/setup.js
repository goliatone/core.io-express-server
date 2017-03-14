/*jshint esversion:6, node:true*/
'use strict';

const path = require('path');
const express = require('express');
const getView = require('./getView');

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

        let parent = path.resolve(__dirname, '..');

        //static
        //TODO: We need to be able to configura this
        //and override on other apps.
        let publicpath = path.join(parent, 'public');

        if(config.publicPath) publicpath = config.publicPath;

        config.publicPath = publicpath;

        app.use(express.static(publicpath));

        //favicon
        const fav = require('serve-favicon');

        let favipath = path.join(parent, 'public/favicon.ico');
        if(config.faviconPath) favipath = config.faviconPath;

        app.use(fav(favipath));
    }

    addViews(){
        let app = this.app;
        let config = this.config;

        /*
         * We handle errors, which means we need
         * to be able to render views...
         */
        let viewpath = path.join(__dirname, '../views');

        if(config.viewsPath) viewpath = config.viewsPath;

        config.viewsPath = viewpath;

        app.set('views', viewpath);
        app.set('view engine', 'ejs');
    }

    mount(){
        var apps = this.config.subapps;

        if(!apps) return;

        var router;

        Object.keys(apps).map((route)=> {
            router = apps[route];
            this.logger.info('mount app: %s', route);
            this.app.use(route, router);
        });
    }

    addErrorHandlers(){
        let app = this.app;
        let config = this.config;

        /*
         * This ensures that the first time we
         * run the app, we can show a default
         * html page.
         *
         * TODO: we should be able to configure the
         * path to the view file.
         */
        app.use((req, res, next)=>{
            if(req.url === '/'){
                let root = config.publicPath;
                let defaultIndex = path.join(root, 'default-index.html');
                return res.sendFile(defaultIndex);
            }
            next();
        });

        // catch 404 and forward to error handler
        app.use(function(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // error handlers

        // development error handler
        // will print stacktrace
        app.use((err, req, res, next)=>{

            let error = {};
            if (app.get('env') === 'development') {
                error = err;
            }

            let status = err.status || 500;

            this.logger.error('Error %s: %s', status, err.message);
            if(status === 500) this.logger.error('%s', err.stack);
            if(!status === 404) this.logger.warn('url: %s',  req.protocol + '://' + req.get('Host') + req.url);

            res.status(status);

            res.format({
                // html|text
                html: function(){
                    let view = getView(app, status, 'error');
                    res.render(view, {
                        message: err.message,
                        error: error,
                        stack: error.stack
                    });
                },
                json: function(){
                    res.send({
                        message: err.message,
                        error: error
                    });
                }
            });
        });
    }

    get express() { return this.app; }

    createServer(port=3000){
        this.app.set('port', port);

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

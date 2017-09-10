/*jshint esversion:6, node:true*/
'use strict';

const path = require('path');
const express = require('express');
const getView = require('./getView');

const TrackFinder = require('trackfinder');

class Setup {
    constructor(app, config) {
        this.app = app;
        this.config = config;
        this.mountedApps = {};
    }

    addRoutes() {
        this.logger.info('Scanning routes...');
        this.logger.info('looking in dir: %s', this.config.routesPath);
        //Wire routes:
        //check all subapps, and add routes for each
        TrackFinder.register(this.app, {
            path: this.config.routesPath,
            config: this.config,
            logger: this.logger
        });
    }

    addMiddleware() {
        let app = this.app;
        let config = this.config;

        let parent = path.resolve(__dirname, '..');

        //static
        //TODO: We need to be able to configura this
        //and override on other apps.
        let publicpath = path.join(parent, 'public');

        if (config.publicPath) publicpath = config.publicPath;

        config.publicPath = publicpath;

        //check all submodules, see if they have a public folder.
        app.use(express.static(publicpath));

        //favicon
        const fav = require('serve-favicon');

        let favipath = path.join(parent, 'public/favicon.ico');
        if (config.faviconPath) favipath = config.faviconPath;

        app.use(fav(favipath));
    }

    addViews() {
        let app = this.app;
        let config = this.config;

        /*
         * We handle errors, which means we need
         * to be able to render views...
         */
        //check all subapps and see if they have a views
        let viewpath = path.join(__dirname, '../views');

        if (config.viewsPath) viewpath = config.viewsPath;

        config.viewsPath = viewpath;

        app.set('views', viewpath);
        app.set('view engine', 'ejs');
    }

    mount() {
        var apps = this.config.subapps;

        if (!apps) return;

        /*
         * This pretty much should always be empty.
         * @TODO: This is awkard, very. We should not
         * store those values in config. We should store
         * in whatever property we espose to application
         * context. So we can do:
         * app.server.findSubapp('admin')
         */
        if(!this.config.mountedApps) this.config.mountedApps = {};

        var router;

        Object.keys(apps).map((route) => {
            router = apps[route];

            this.extend(router);

            this.logger.info('mount app: %s', route);
            this.app.use(route, router);
            this.config.mountedApps[router.appId] = router;
        });
    }

    extend(subapp) {
        /*
         * How can we extend express protoype?
         * Also, we need to extend both app and
         * router, since we can use them both
         */
        subapp.getRoot = function() {
            var root = this;
            //@TODO add guard here, do not while for evers.
            while (root.parent) {
                root = root.parent;
            }

            return root;
        };

        /**
         * Ensure we have a view path in a given app.
         * @method ensureViewHasPath
         * @param  {Express}          app
         * @param  {String}          moduleId
         * @return {void}
         */
        subapp.addViewPath = function(path) {
            let paths = this.get('views');
            if(!Array.isArray(paths)) paths = [paths];

            /*
             * Here we basically want to ensure we
             * dont already have the view path.
             * We could have different forms of
             * the same path:
             * - ./modules/invite/views
             * - /opt/myapp/src/modules/invite/views
             */
            if(paths.indexOf(path) === -1) {
                return;
            }

            paths.push(path);
            this.set('views', paths);
        };
    }

    addErrorHandlers() {
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
        app.use(function handleServeIndexIfNotDefined(req, res, next) {
            if (req.url === '/') {
                let root = config.publicPath;
                let defaultIndex = path.join(root, 'default-index.html');
                return res.sendFile(defaultIndex);
            }
            next();
        });

        // catch 404 and forward to error handler
        app.use(function handle404(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // error handlers

        // development error handler
        // will print stacktrace
        let self = this;

        //@TODO: We should be able to attach error processors.
        //e.g. if we get a Waterline error, we should be able to parse
        //it here and send something menaingful...
        app.use(function handleErrorFinal(err, req, res, next) {

            let error = {};
            if (app.get('env') === 'development') {
                error = err;
            }

            let status = err.status || 500;

            switch (status) {
                case 500:
                    self.logger.error('Error %s: %s', status, err.message);
                    self.logger.error('%s', err.stack);
                    break;
                case 404:
                    self.logger.warn('url: %s', req.protocol + '://' + req.get('Host') + req.url);
                    break;
                case 401:
                    self.logger.warn('Auth error url: %s', err.message);
                    break;
                default:
                    self.logger.error('Error %s: %s', status, err.message);

            }

            res.status(status);

            /**
             * res.format performs content negotiation
             * on the `Accept` HTTP header on the req
             * object when present.
             *
             * If the header is not specified the first
             * callback is invoked.
             *
             * When no match is found, it responds with
             * a 406 Not Acceptable, or invokes the
             * `default` callback.
             *
             * @type {[type]}
             */
            res.format({
                // html|text
                html: function formatHMTL() {
                    let view = getView(app, status, 'error');
                    res.render(view, {
                        message: err.message,
                        error: error,
                        stack: error.stack
                    });
                },
                json: function formatJSON() {
                    res.send({
                        success: false,
                        message: error.message
                    });
                },
                default: function formatDef() {
                    let view = getView(app, status, 'error');
                    res.render(view, {
                        message: err.message,
                        error: error,
                        stack: error.stack
                    });
                }
            });
        });
    }

    get express() {
        return this.app;
    }

    createServer(port = 3000) {
        this.app.set('port', port);

        const http = require('http');

        this.server = http.createServer(this.app);

        this.server.on('clientError', (err, socket) => {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });

        /*
         * TODO: We might want to pass
         * the **hostname** as well.
         * If you bind
         */
        this.server.listen(port);

        return this.server;
    }
}

module.exports = Setup;

/*jshint esversion:6, node:true*/
'use strict';
const fs = require('fs');
const path = require('path');
const extend = require('gextend');
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


        let config = this.config;

        if (!config.routesPath || config.routesPath.length == 0) {
            let routesPath = path.join(config.basepath, config.moduleid, 'routes');

            if (!fs.existsSync(routesPath)) {
                return;
            }
            config.routesPath = routesPath;
        }
        //Wire routes:
        //check all subapps, and add routes for each
        // TrackFinder.register(this.app, {
        //     path: config.routesPath,
        //     config: config,
        //     logger: this.logger
        // });
    }

    addMiddleware() {
        let app = this.app;
        let config = this.config;

        let parent = path.resolve(__dirname, '..');

        app.disable('x-powered-by');

        /**
         * Store a reference to paths.
         * We should manage this externally!
         */
        this.app.moduleRoot = parent;

        /**
         * We use this in the case that we want 
         * to serve the default-index.html file.
         */
        this.app.modulePublic = path.join(parent, 'public');

        /**
         * If we dont provide a public directory name,
         * we assume it will be "public".
         */
        if (!config.publicDirName) {
            config.publicDirName = 'public';
        }

        /** 
         * I user created a public directory in their
         * root server then use that, else use this
         * modules default public. 
         */
        let userPublic = path.join(config.basepath, config.moduleid, config.publicDirName);
        let userPublicExists = fs.existsSync(userPublic);

        //TODO: If we don't specify a public path we break clients!!
        if (!config.publicPath && userPublicExists) {
            config.publicPath = userPublic;
        } else {
            config.publicPath = this.app.modulePublic;
        }

        /**
         * This is used by middleware
         * to build paths...
         */
        if (!config.moduleDir) {
            config.moduleDir = path.join(config.basepath, config.moduleid);
        }

        /**
         * TODO: Need options for `static`:
         * - dotfiles {String} [ignore] allow|deny|ignore
         * - etag {Boolean} [true]
         * - extensions {Mixed} [false] ['html', 'htm']
         * - etc...
         */

        //favicon
        if (!config.faviconPath) {
            config.faviconPath = path.join(userPublic, 'favicon.ico');
            if (!fs.existsSync(config.faviconPath)) {
                config.faviconPath = path.join(this.app.modulePublic, 'favicon.ico');
            }
        }

        /**
         * TODO: We should use the same process as for registering a
         * default sub app
         */
        let middleware = require('./middleware');
        middleware = extend({}, middleware, config.middleware);

        let use = [
            'poweredBy',
            'compression',
            // 'livereload',
            'viewEngine',
            'favicon',
            'expressStatic',
            'logger',
            'requestId',
            'bodyParser',
            'session',
            'expressLayouts',
            'flash',
            'passport',
            'csrf',
            'appVariables',
            'routes',
            'locals',
            'fileUpload'
        ];

        if (config.middleware && config.middleware.use) {
            use = config.middleware.use;
        }

        use.map(id => {
            middleware[id](app, config);
        });
    }

    addViews() {
        let app = this.app;
        let config = this.config;

        if (!config.viewsPath) {
            config.viewsPath = [];

            /*
             * We handle errors, which means we need
             * to be able to render views...
             * this is core.io-express-server/views
             */
            let coreViews = path.join(__dirname, '../views');

            /*
             * If user created a views directory in their 
             * application's server module then use it.
             * This is something like:
             * ./modules/server/views
             */
            let modulesView = path.join(config.basepath, config.moduleid, 'views');

            if (fs.existsSync(modulesView)) {
                config.viewsPath.push(modulesView);
            }

            config.viewsPath.push(coreViews);
            console.log('------- views path ------');
            console.log(config.viewsPath);
        }
    }

    mount() {
        var apps = this.config.subapps;

        if (!apps) return;

        /*
         * This pretty much should always be empty.
         * @TODO: This is awkard, very. We should not
         * store those values in config. We should store
         * in whatever property we expose to application
         * context. So we can do:
         * app.server.findSubapp('admin')
         */
        if (!this.config.mountedApps) this.config.mountedApps = {};

        var router;

        Object.keys(apps).map((route) => {
            router = apps[route];

            this.extend(router, route);

            this.logger.info('mount app: %s', route);
            this.app.use(route, router);
            this.config.mountedApps[router.appId] = router;
        });
    }

    extend(subapp, route) {

        subapp.once('mount', (parent) => {
            this.logger.warn('Sub app "%s": "%s" mounted. Attaching parent.', route, subapp.get('appId'));
            subapp.parent = parent;
        });

        /* 
         * NOTE: This is only available after
         * the sub application has been mounted.
         * 
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
         * 
         * NOTE: This is only available after
         * the sub application has been mounted.
         * 
         * @method ensureViewHasPath
         * @param  {Express}          app
         * @param  {String}          moduleId
         * @return {void}
         */
        subapp.addViewPath = function(path) {
            let paths = this.get('views');

            if (!Array.isArray(paths)) paths = [paths];

            /*
             * Here we basically want to ensure we
             * dont already have the view path.
             * We could have different forms of
             * the same path:
             * - ./modules/invite/views
             * - /opt/myapp/src/modules/invite/views
             */
            if (paths.indexOf(path) === -1) {
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
         * html page. Even if we have a different 
         * public directory, we want to be able 
         * to show something...
         * 
         * TODO: We should copy/move the index.html
         * file to our apps server directory, so we
         * don't hide it out of the view and ppl 
         * can start editing something :)
         *
         * TODO: we should be able to configure the
         * path to the view file.
         * 
         */
        app.use(function handleServeIndexIfNotDefined(req, res, next) {
            if (req.url === '/') {
                const root = app.modulePublic;
                const defaultIndex = path.join(root, 'default-index.html');
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

        /*
         * Final error handler... if we get here nothing else
         * has dealt with an error.
         *
         * Note that core.io-express-auth does handle 403
         *
         * @TODO: We should be able to attach error processors.
         * e.g. if we get a Waterline error, we should be able to parse
         * it here and send something menaingful...
         */
        app.use(function handleErrorFinal(err, req, res, next) {

            let error = {};
            if (app.get('env') === 'development') {
                error = err;
            }

            let status = err.status || 500;

            switch (status) {
                /*
                 * Unauthorized
                 * API: expired or malformed tokens
                 */
                case 401:
                    self.logger.warn('Unauthorized 401 error url: %s', err.message);
                    break;
                    /*
                     * Forbidden
                     * Server reciveds valid credentials that
                     * are not adecuate to gain access.
                     */
                case 403:
                    self.logger.warn('Forbidden 403 error url: %s', err.message);
                    break;
                case 404:
                    self.logger.warn('404 URL: %s', req.protocol + '://' + req.get('Host') + req.url);
                    break;
                case 500:
                    self.logger.error('Error %s: %s', status, err.message);
                    self.logger.error('%s', err.stack);
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
                        isErrorView: true,
                        status: status,
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
                        isErrorView: true,
                        status: status,
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

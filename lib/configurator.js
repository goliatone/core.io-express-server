/*jshint esversion:6, node:true*/
'use strict';

const join = require('path').join;
const getPort = require('./utils').getPort;
const extend = require('gextend');

class Configurator {

    constructor(config) {
        this.init(config);
    }

    init(config) {
        this.config = config;
        this.logger = config.logger || console;

        this.validate(config);
    }

    validate(config) {

        extend(config, Configurator.DEFAULTS, config);


        //TODO: we should ensure we have a valid config!!
        //List of required properties:
        //port
        if (!config.port) {
            config.port = getPort();
            this.logger.info('validate: No "config.port" specified. Using %s.', config.port);
            this.logger.info('You can set PORT OR NODE_APP_PORT env vars');
        }

        //baseUrl
        if (!config.baseUrl) {
            /*
             * This actually should be a bit more nuanced.
             * If we have a hostname, and it has a domain,
             * or if we have ssl, and what not.
             */
            let protocol = '';
            if (config.hostname.indexOf('http') === -1) {
                /*
                 * We are not supporting https, right
                 * now I prefer to terminate SSL before
                 * hitting node. Eventually we could
                 * check config for either
                 * config.ssl === true
                 * config.ssl && (config.ssl.key && config.ssl.crt)
                 */
                protocol = (config.port === 443 ? 'https' : 'http') + '://';
            }

            let port = (config.port === 80 || config.port === 443) ? '' : ':' + config.port;

            config.baseUrl = `${protocol}${config.hostname}${port}`;
            this.logger.info('validate: No "config.baseUrl" specified. Using %s.', config.baseUrl);
        }

        return config;
    }

    /**
     * Ensures that the configuration object has
     * the required fields.
     *
     * This way, our sub applications can inherit
     * required properties from `server`
     * configuration, or inferred using the module
     * name.
     *
     * @TODO: Maybe rename? we are not adding defaults
     *        but ensuring the passed object has required
     *        default values.
     *
     * @method addDefaults
     *
     * @param {Object} config   Sub application config.
     * @return {void}
     */
    addDefaults(config) {
        if (!config.basedir) {

            if (!config.hasOwnProperty('moduleid')) {
                throw new Error('You need to specify "config.basedir". Else set "config.moduleid" so we can guess.');
            }

            config.basedir = './modules/' + config.moduleid;
            //Now we dont have access to context.modulespath...
            // let sep = require('path').sep;
            // config.basedir = [context.modulespath, config.moduleid].join(sep);

            this.logger.warn('You did not specify a "basedir"?');
            this.logger.warn('We are making a guess: %s', config.basedir);
        } else {
            this.logger.warn('Loading views and assets from: %s', config.basedir);
        }

        if (!config.baseUrl) {
            config.baseUrl = this.config.baseUrl;
        }

        if (!config.routes) {
            config.routes = {
                path: [join(config.basedir, 'routes')]
            };
        }

        if (!config.mount) {
            config.mount = '/' + config.moduleid;
        }
    }

    /**
     * Register a subapp with the config object.
     * Also we register a once listener for
     * **mount** event. We attach parent to the
     * subapp.
     *
     * @method mount
     * @param  {String} id  Base route for subapp
     * @param  {Object} app Express subapp
     * @return {void}
     */
    mount(route, app) {
        if (this.subapps[route]) {
            this.logger.warn('We are overriding sub app %s. Already registered.', route);
        }

        app.once('mount', (parent) => {
            this.logger.warn('Sub app "%s":"%s" mounted. Attaching parent.', route, app.get('appId'));
            app.parent = parent;
        });

        this.subapps[route] = app;
    }

    addRoute(path) {
        this.routes.push(path);
        return this;
    }

    addPublicPath(path) {
        this.publics.push(path);
        return this;
    }

    get subapps() {
        return this.config.subapps;
    }

    get routes() {
        let routesPath = this.config.routesPath;
        if (!Array.isArray(routesPath)) routesPath = [routesPath];
        return routesPath;
    }

    get publics() {
        let routesPath = this.config.publicPaths;
        if (!Array.isArray(routesPath)) routesPath = [routesPath];
        return routesPath;
    }

    /**
     * Application context.
     *
     * @method context
     * @param  {Object} v
     */
    set context(v) {
        this._context = v;
    }

    get context() {
        return this._context;
    }

}

Configurator.DEFAULTS = {
    subapps: {},
    routesPath: [],
    publicPaths: [],
    hostname: 'localhost',
    //TODO: Figure out the best way to
    //do this. Should we have a class
    //handling this? Right now this is
    //not being used :)
    formatErrorResponse: {
        json: function(res, err) {
            res.send({
                success: false,
            });
        }
    }
};

module.exports = Configurator;

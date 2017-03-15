/*jshint esversion:6, node:true*/
'use strict';

const join = require('path').join;
const getPort = require('./utils').getPort;

class Configurator {
    constructor(config){
        this.init(config);
    }

    init(config){
        if(!config.subapps) config.subapps = {};
        if(!config.routesPath) config.routesPath = [];
        if(!config.publicPaths) config.publicPaths = [];

        this.config = config;
        this.logger = config.logger || console;
    }

    validate(config){
        //TODO: we should ensure we have a valid config!!
        //List of required properties:
        //port
        if(!config.port) {
            config.port = getPort();
            this.logger.info('validate: No "config.port" specified. Using %s.', config.port);
        }
        //hostname
        //baseUrl
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
     * @method addDefaults
     *
     * @param {Object} config   Sub application config.
     * @return {void}
     */
    addDefaults(config){
        if(!config.basedir){

            if(!config.hasOwnProperty('moduleid')){
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

        if(!config.baseUrl){
            config.baseUrl = this.config.baseUrl;
        }

        if(!config.routes){
            config.routes = {
                path: [join(config.basedir, 'routes')]
            };
        }

        if(!config.mount){
            config.mount = '/' + config.moduleid;
        }
    }

    mount(id, app){
        if(this.subapps[id]){
            this.logger.warn('We are overriding sub app %s. Already registered.', id);
        }

        app.once('mount', (parent)=>{
            this.logger.warn('Sub app %s mounted. Attaching parent.', id, app.get('appId'));
            app.parent = parent;
        });

        this.subapps[id] = app;
    }

    addRoute(path){
        this.routes.push(path);
        return this;
    }

    addPublicPath(path){
        this.publics.push(path);
        return this;
    }

    get subapps(){
        return this.config.subapps;
    }

    get routes(){
        let routesPath = this.config.routesPath;
        if(!Array.isArray(routesPath)) routesPath = [routesPath];
        return routesPath;
    }

    get publics(){
        let routesPath = this.config.publicPaths;
        if(!Array.isArray(routesPath)) routesPath = [routesPath];
        return routesPath;
    }

    set context(v){ this._context = v;}
    get context(){ return this._context;}

}

module.exports = Configurator;

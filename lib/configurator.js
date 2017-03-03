/*jshint esversion:6, node:true*/
'use strict';

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

    validate(){
        //TODO: we should ensure we have a valid config!!
        //List of required properties:
        //port
        //hostname
        //baseUrl
    }

    mount(id, app){
        if(this.subapps[id]){
            this.logger.warn('We are overriding sub app %s. Already registered.', id);
        }

        app.once('mount', (parent)=>{
            this.logger.warn('Sub app %s mounted. Attaching parent.', id, app.appId);
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

/*jshint esversion:6, node:true*/
'use strict';

class Configurator {
    constructor(config){
        this.config = config;
        this.logger = config.logger || console;
    }

    mount(id, app){
        if(this.subapps[id]){
            this.logger.warn('We are overriding sub app %s. Already registered.', id);
        }

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
        let paths = this.config.subapps;

        if(!paths){
            this.config.subapps = paths = {};
        }

        return paths;
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

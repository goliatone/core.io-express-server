/*jshint esversion:6, node:true*/
'use strict';

/*
 * This adaptor brings up an express subapp
 * to provide a dashboard. It relies on the
 * server module, which is the a bare bones
 * express server to which we mount different
 * sub applications.
 */
module.exports = function $initializeSubappWrapper(App, subappId){

    if(typeof App === 'string') {
        subappId = App;
        App = require('./defaultApp')();
    }

    return function $initializeSubapp(context, config){
        let logger = context.getLogger(subappId);

        if(!config.logger) config.logger = logger;

        logger.warn('%s module initialize', subappId);

        context.on('server.pre', (configurator)=>{

            logger.info('%s server.pre hook...', subappId);

            /*
             * We just need to register our routes folder by
             * adding them to the configuration option
             * `routesPath`. Those will get autoloaded
             * by the server module.
             */
            let mountPath = config.mount || '/' + subappId;

            logger.info('%s mounting application. Mount path: %s', subappId, mountPath);

            /*
             * Right now, App.init will mount middlware.
             * We should remove it from defaultApp and
             * have it go through configurator or setup.
             */
            let subapp = App.init(context, config);
            subapp.set('appId', subappId);

            // configurator.middlware(subapp, config);

            configurator.mount(mountPath, subapp);
        });
    };
};

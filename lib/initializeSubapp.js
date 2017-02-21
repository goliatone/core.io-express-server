/*jshint esversion:6, node:true*/
'use strict';

/*
 * This adaptor brings up an express subapp
 * to provide a dashboard. It relies on the
 * server module, which is the a bare bones
 * express server to which we mount different
 * sub applications.
 */
module.exports = function $initializeSubappWrapper(App){

    return function $initializeSubapp(context, config){
        let logger = context.getLogger('dashboard');

        logger.warn('Dashboard module initialize');

        context.on('server.pre', (configurator)=>{
            logger.info('Dashboard server.pre hook...');

            /*
             * We just need to register our routes folder by
             * adding them to the configuration option
             * `routesPath`. Those will get autoloaded
             * by the server module.
             */
            // config.dashboard.mount => /
            let mountPath = config.mount || '/';
            configurator.mount(mountPath, App.init(context, config));
        });
    };
};

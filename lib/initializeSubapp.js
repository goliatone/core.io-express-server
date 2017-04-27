/*jshint esversion:6, node:true*/
'use strict';

/*
 * This adaptor brings up an express subapp
 * to provide a dashboard. It relies on the
 * server module, which is the a bare bones
 * express server to which we mount different
 * sub applications.
 * @TODO: We should rename subappId to moduleid?
 *        they should be the same.
 */
module.exports = function $initializeSubappWrapper(App, subappId) {

    if(typeof App === 'string') {
        subappId = App;
        App = require('./defaultApp')();
    }

    return function $initializeSubapp(context, config) {
        let logger = context.getLogger(subappId);

        if(!config.logger) config.logger = logger;

        logger.warn('%s module initialize', subappId);

        context.on('server.pre', (configurator) => {

            logger.info('%s server.pre hook...', subappId);

            /*
             * Ensure we have all required values.
             * We try to infer if missing.
             */
            configurator.addDefaults(config);

            logger.info('%s mounting application. Mount path: %s', subappId, config.mount);

            /*
             * Right now, App.init will mount middlware.
             * We should remove it from defaultApp and
             * have it go through configurator or setup.
             */
            let subapp;

            try {
                subapp = App.init(context, config);
            } catch(err) {
                logger.error('Error initializing sub application %s.', subappId);
                throw err;
            }

            //@TODO: Can we move this to configurator?!
            subapp.set('appId', subappId);

            // configurator.middlware(subapp, config);

            /*
             * We just need to register our routes folder by
             * adding them to the configuration option
             * `routesPath`. Those will get autoloaded
             * by the server module.
             */
            configurator.mount(config.mount, subapp);
        });
    };
};

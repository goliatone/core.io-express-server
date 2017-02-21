'use strict';

module.exports = function locals(app, config){

    Object.keys(config.locals || {}).map((key)=>{
        app.locals[key] = config.locals[key];
    });

    app.locals.ENV = app.get('env');
};

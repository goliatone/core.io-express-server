'use strict';

function poweredBy(app, config){
    // app.disable('x-powered-by');
    app.use(function xPoweredBy(req, res, next){
        res.header('x-powered-by', 'CoreIO <core.io>');
        next();
    });
}

module.exports = poweredBy;

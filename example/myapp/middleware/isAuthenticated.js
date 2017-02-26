'use strict';

module.exports = function appVariables(app, config){
    return function(req, res, next){
        console.log('Here!!!!!');
        next();
    };
};

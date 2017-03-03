'use strict';

module.exports = function appVariables(app, config){

    return function $isAuthenticated(req, res, next){
        
        if(req.isAuthenticated()) next();
        else {
            req.session.returnTo = req.path;
            //TODO: we need to get this from config...
            res.redirect('/login');
        }
    };
};

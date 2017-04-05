'use strict';

const csrf = require('csurf');

/*
 * TODO: This middleware is really sensitive
 * to order. In fact, we should register CRUD
 * or APIs before this middleware.
 * Until we figure out a way to guaranty this
 * order, it will be disabled.
 *
 * TODO: This middleware requires cookieParser, and
 * it also requires cookieParser to be enabled before
 * itself.
 *
 * <form action="/process" method="POST">
 *     <input type="hidden" name="_csrf" value="{{csrfToken}}">
 *     Favorite color: <input type="text" name="favoriteColor">
 *     <button type="submit">Submit</button>
 * </form>
 */
module.exports = function(app, config){
    if(app.get('env') === 'development') return;

    return;
    
    app.use(csrf());

    app.use(function (req, res, next) {
        res.locals['csrf_token'] = req.csrfToken();
        next();
    });
};

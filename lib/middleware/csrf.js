const csrf = require('csurf');

module.exports = function(app, config){
    if(app.get('env') === 'development') return;

    app.use(csrf());

    // This could be moved to view-helpers :-)
    app.use(function (req, res, next) {
        res.locals.csrf_token = req.csrfToken();
        next();
    });
};

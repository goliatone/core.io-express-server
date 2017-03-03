'use strict';

function getView(app, status, defaultView='error'){
    const path = require('path');
    const views = app.get('views');
    const ext = app.get('view engine');
    const exists = require('fs').existsSync;

    const view = path.join(views, status + '.' + ext);

    if(exists(view)) return view;

    if(app.parent) return getView(app.parent, status, defaultView);

    return defaultView;
}

module.exports = getView;

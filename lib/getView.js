'use strict';
const path = require('path');
const exists = require('fs').existsSync;

/**
 * This function will try to return a valid path to
 * a view.
 *
 * It will recursively call itself while the provided
 * express instance has a `parent` attribute.
 *
 * @TODO: Move to it's own package.
 *
 * @param  {Object} app                   Express instance
 * @param  {String} viewName              View name without ext
 * @param  {String} [defaultView='error']
 * @return {String}                       Path to a valid view.
 */
function getView(app, viewName, defaultView='error'){
    /*
     * views could be an array...
     */
    let views = app.get('views');
    const ext = app.get('view engine');

    if(!Array.isArray(views)) views = [views];

    let view;
    for(var i = 0; i < views.length; i++){
        view = path.join(views[i], viewName + '.' + ext);
        if (exists(view)) return view;
    }

    if (app.parent) return getView(app.parent, viewName, defaultView);

    return defaultView;
}

module.exports = getView;

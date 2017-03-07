'use strict';

module.exports = function livereload(app, config){
    if(app.get('env') !== 'development') return;

    let reloadify = require('reloadify')('/Users/eburgos/Development/WW/hotdesk-server/modules/dashboard/views');
    app.use(reloadify);

    reloadify = require('reloadify')('/Users/eburgos/Development/WW/hotdesk-server/modules/dashboard/public');
    app.use(reloadify);
};

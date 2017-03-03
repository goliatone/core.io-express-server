'use strict';

module.exports = function appVariables(app, config){
    app.set('ID', config.moduleid || 'root');
};

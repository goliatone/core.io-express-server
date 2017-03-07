'use strict';

module.exports = function livereload(app, config){
    if(app.get('env') !== 'development') return;

    const path = require('path');

    var typeMap = {
        ejs: 'html', // `index.ejs` maps to `index.html`,
        css: 'css',
        js: 'js'
    };
    var fileRxp = new RegExp('\\.(' + Object.keys(typeMap).join('|') + ')$');

    var paths = [config.basedir];
    var watchDirs = [];

    paths.map((p)=>{
        watchDirs.push(path.join(p, 'views'));''
        watchDirs.push(path.join(p, 'public'));
        //TODO: How do we add a multiple of HTML subdirectories?
        watchDirs.push(path.join(p, 'public/js/widgets/**'));
    });

    var easyLivereload = {
        app: app,
        watchDirs: watchDirs,
        checkFunc: function(file) {
          return fileRxp.test(file);
        },
        renameFunc: function(file) {
          // remap extention of the file path to one of the extentions in `file_type_map`
          return file.replace(fileRxp, function(extention) {
            return '.' + typeMap[extention.slice(1)];
          });
        }
    };

    app.use(require('easy-livereload')(easyLivereload));
};

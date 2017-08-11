'use strict';
const cors = require('cors');
const Keypath = require('gkeypath');

module.exports = function(app, config){

    let options = Keypath.get(config, 'cors');

    app.use(cors(options));
};

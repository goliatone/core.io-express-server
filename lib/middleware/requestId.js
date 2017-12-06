'use strict';

const uuid = require('uuid');
const extend = require('gextend');

const DEFAULTS = {
    reqHeader: 'X-Request-Id',
    resHeader: 'X-Request-Id',
    paramName: '_req_id',
    generator: require('uuid'),
    // getter: function(){
    //
    // },
    attributeName: 'reqId'
};

module.exports = function $requestId(app, config){
    app.use(requestId(config));
};

/*
 * We should be using [correlation-id][1] to
 * ensure we have the same ID per unique req.
 *
 * [1]:https://github.com/toboid/correlation-id
 */
function requestId(options){

    options = extend({}, DEFAULTS);

    return function requestIdMiddleware(req, res, next){

        let id = _getId(req, options);
        let attributeName = options.attributeName;

        // console.log('requestid', id);

        /*
         * Want to expose the genrated
         * id in the request and response
         */
        req[attributeName] = id;

        if(res.req) res.req[attributeName] = id;

        /*
         * We send a header with the required
         * id...
         */
        if(options.resHeader) {
            res.set(options.resHeader, id);
        }

        next();
    }
}

function _getId(req, options){

    let generator = options.generator;
    let paramName = options.paramName;
    let headerName = options.reqHeader;

    return req.header(headerName) || _param(req, paramName, generator);
}

function _param(req, name, def){
    let body = req.body || {};
    let query = req.query || {};
    let params = req.params || {};

    if (null != params[name] && params.hasOwnProperty(name)) return params[name];
    if (null != body[name]) return body[name];
    if (null != query[name]) return query[name];

    return typeof def === 'function' ? def() : def;
}

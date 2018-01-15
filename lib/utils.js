/*jshint esversion:6, node:true*/
'use strict';

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val, def=3000) {
    var port = parseInt(val, 10);

    // named pipe
    if (isNaN(port)) return val;

    // port number
    if (port >= 0) return port;

    return def;
}

module.exports.normalizePort = normalizePort;

function getPort(port=3000) {
    return normalizePort(process.env.PORT || process.env.NODE_APP_PORT || port);
}

module.exports.getPort = getPort;

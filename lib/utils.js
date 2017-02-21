/*jshint esversion:6, node:true*/
'use strict';

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

module.exports.normalizePort = normalizePort;


function getPort(){
    return normalizePort(process.env.PORT || process.env.NODE_APP_PORT || '3000');
}

module.exports.getPort = getPort;

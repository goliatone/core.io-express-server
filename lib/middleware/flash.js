'use strict';

const Keypath = require('gkeypath');

module.exports = function passport(app, config) {
    /*
     * We use as follows:
     * res.flash('info', 'Flash is back!');
     *
     * In template:
     *
     * <% if (flash.info) { %>
     *     <p><%= flash.info %></p>
     * <% } %>
     */
    // const flash = require('express-flash-2');
    app.use(flash());
};



var format = require('util').format;
var isArray = require('util').isArray;

/**
 * Expose `flash()` function on responses.
 *
 * @return {Function}
 * @api public
 */
function flash(options) {
    options = options || {};
    var safe = (options.unsafe === undefined) ? true : !options.unsafe;

  return function flashMiddlware(req, res, next) {
        if (!(res.flash && safe)) {
            res.flash = _flash;
        }

        /*
         * This is a hack for now.
         * Issue is we run socket.io from
         * server module.
         * We serve dashboard page from
         * dashboard module.
         *
         */
        if(!req.session) req.session = {};

        // put the flash into res.locals
        var flash = Keypath.get(res, 'req.session.flash', {});
        res.req.session.flash = {};
        res.locals.flash = flash;
        next();
    };
}

module.exports.flash = flash;

/**
 * Queue flash `msg` of the given `type`.
 *
 * Examples:
 *
 *      req.flash('info', 'email sent');
 *      req.flash('error', 'email delivery failed');
 *      req.flash('info', 'email re-sent');
 *      // => 2
 *
 *
 * Formatting:
 *
 * Flash notifications also support arbitrary formatting support.
 * For example you may pass variable arguments to `req.flash()`
 * and use the %s specifier to be replaced by the associated argument:
 *
 *     req.flash('info', 'email has been sent to %s.', userName);
 *
 * Formatting uses `util.format()`, which is available on Node 0.6+.
 *
 * @param {String} type
 * @param {String} msg
 * @return {Number}
 * @api public
 */
function _flash(type, msg) {
  var session = this.req.session;
  if (session === undefined) throw Error('res.flash() requires sessions');
  var msgs = session.flash = session.flash || {};
  if (type && msg) {
    // util.format is available in Node.js 0.6+
    if (arguments.length > 2 && format) {
      var args = Array.prototype.slice.call(arguments, 1);
      msg = format.apply(undefined, args);
    } else if (isArray(msg)) {
      msg.forEach(function(val){
        (msgs[type] = msgs[type] || []).push(val);
      });
      return msgs[type].length;
    }
    return (msgs[type] = msgs[type] || []).push(msg);
  }
}

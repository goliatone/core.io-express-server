'use strict';

module.exports = function passport(app, config){
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
    const flash = require('express-flash-2');
    app.use(flash());
};

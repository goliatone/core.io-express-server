/*jshint esversion:6, node:true*/
'use strict';

var express = require('express');
var router = express.Router();


module.exports = function(app, config){
    router.get('/hello', (req, res)=>{
        console.log('HERE!!');
        res.status(200).send('OK');
    });

    app.use('/', router);
};

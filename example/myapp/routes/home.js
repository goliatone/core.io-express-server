/*jshint esversion:6, node:true*/
'use strict';

var express = require('express');
var router = express.Router();
var applyPolicies = require('../middleware/core.io-auth').applyPolicies;

module.exports = function(app, config){

    let policies = applyPolicies('GET /hello', app, config);

    router.get('/hello', policies, (req, res)=>{
        console.log('/hello');
        res.status(200).send('<b>Hello</b>');
    });

    router.get('/testing', [], (req, res)=>{
        console.log('/testing');
        res.status(200).send('<b>Testing</b>');
    });

    app.use('/', router);
};

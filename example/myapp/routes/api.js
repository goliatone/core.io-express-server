/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');
const express = require('express');
const router = express.Router();
const applyPolicies = require('core.io-express-auth').applyPolicies;

module.exports = function(app, config){

    router.get('/api/user', [], (req, res)=>{
        res.send({
            id: 1,
            name: 'goliatone',
            pet: {
                id: 1,
                name: 'mr. socks'
            }
        });
    });

    router.get('/api/pet', [], (req, res)=>{
        res.send({
            id: 1,
            name: 'mr. socks',
            owner: {
                id: 1,
                name: 'goliatone'
            }
        });
    });

    app.use('/', router);
};

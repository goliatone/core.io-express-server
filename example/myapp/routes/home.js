/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');
const express = require('express');
const router = express.Router();
const applyPolicies = require('../middleware/core.io-auth').applyPolicies;

module.exports = function(app, config){

    let policies = applyPolicies('GET /profile', app, config);

    router.get('/profile', policies, (req, res)=>{
        res.render('pages/profile', extend({}, config.locals, {
            user:req.user
        }));
    });

    router.get('/api/health', (req, res, next)=>{
        req._passport.instance.authenticate('bearer', {session: false})(req, res, next);
    }, (req, res)=>{
        res.send({
            ok: true
        });
    });

    router.get('/testing', [], (req, res)=>{
        console.log('/testing');
        res.status(200).send('<b>Testing</b>');
    });

    app.use('/', router);
};

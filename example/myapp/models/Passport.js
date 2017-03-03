/*jshint esversion:6, node:true*/
'use strict';

const extend = require('gextend');

let _data = {
    _i: 1,
    1: {
        id: 1,
        email: 'hello@goliatone.com'
    }
};

let Passport = {
    findOneById: function(id){
        return Promise.resolve(_data[id]);
    },
    findOne: function(...query){
        return Promise.resolve(_data[2]);
    },
    create: function(passport){
        console.log('createPassport', JSON.stringify(passport, null, 4));

        passport.toJSON = function(){
            let clone = extend({}, this);
            delete clone.password;
            return clone;
        };

        return Promise.resolve(passport);
    },
    destroy: function(user){
        return Promise.resolve();
    },
    update: function(user){
        return Promise.resolve();
    }
};

module.exports = Passport;

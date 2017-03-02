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

let PassportUser = {
    findUserById: function(id){
        return Promise.resolve(_data[id]);
    },
    findOne: function(...query){
        return Promise.resolve(_data[2]);
    },
    createUser: function(user){
        console.log('createUser', JSON.stringify(user, null, 4));

        const cryptoUtils = require('../middleware/core.io-auth/cryptoUtils');
        ++_data._i;
        let i = _data._i;
        user.id = i;
        _data[i] = user;

        return cryptoUtils.hash(user).then((user)=>{
            console.log('Added user:', user);
            console.log(Object.keys(_data));
            return user;
        });
    },
    createPassport: function(passport){
        console.log('createPassport', JSON.stringify(passport, null, 4));
        return Promise.resolve(passport);
    },
    cleanUser: function(user){
        let clone = extend({}, user);
        delete clone.password;
        return clone;
    },
    deleteUser: function(user){
        return Promise.resolve();
    },
    updateUser: function(user){
        return Promise.resolve();
    }
};

module.exports = PassportUser;

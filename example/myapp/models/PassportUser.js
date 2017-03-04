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
    findOneById: function(id){
        return Promise.resolve(_data[id]);
    },
    findOne: function(...query){
        return Promise.resolve(_data[2]);
    },
    create: function(user){
        console.log('PassportUser:create', JSON.stringify(user, null, 4));

        ++_data._i;
        let i = _data._i;
        user.id = i;
        _data[i] = user;

        user.toJSON = function(){
            let clone = extend({}, this);
            delete clone.password;
            return clone;
        };

        return Promise.resolve(user);
    },
    destroy: function(query){
        return Promise.resolve();
    },
    update: function(user){
        return Promise.resolve();
    }
};

module.exports = PassportUser;

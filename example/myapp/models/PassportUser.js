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

        const cryptoUtils = require('../middleware/core.io-auth/cryptoUtils');
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

        // return cryptoUtils.hash(user).then((user)=>{
        //     console.log('Added user:', user);
        //     console.log(Object.keys(_data));
        //     return user;
        // });
    },
    destroy: function(query){
        return Promise.resolve();
    },
    update: function(user){
        return Promise.resolve();
    }
};

module.exports = PassportUser;

var config = require('../utils/config');
var nano = require('nano')(config.couchdbAddress);
var db = nano.use(config.dbName);
var async = require('async');

var e = exports;

var getUserByUsername = e.getUserByUsername = function (username, callback) {
    db.view("account", "byUsername", { include_docs:true, key:username }, function (err, body) {
        if (!err) {
            if (body.rows.length == 0)
                callback(null, null); // user not found for that username
            else
                callback(null, body.rows[0].doc); // return the user object
        }
        else {
            callback(err, null); // return the error
        }
    });
};

var register = e.register = function (user, callback) {
    user.type = "user";
    getUserByUsername(user.username, function (err, user2) {
        if (!err) {
            if (!user2) {
                db.insert(user, function (err, body) {
                    callback(err, user);
                });
            }
            else callback("username is taken", null);
        } else {
            callback(err, null);
        }
    });
}

var login = e.login = function (username, password, callback) {
    getUserByUsername(username, function (err, user) {
        if (!user)
            callback("invalid username", null);
        else if (user.password == password) {
            callback(null, user);
        }
        else {
            callback("invalid password", null);
        }
    });
};
var config = require('../utils/config');
var nano = require('nano')(config.couchdbAddress);
var db = nano.use(config.dbName);
var async = require('async');
var loqui = require('../logic/loqui');

var e = exports;

var fnames = ["David", "John", "Alex", "Henry", "Joe", "Mark", "Trevor", "Peter", "Richard", "Jason" ];
var lnames = ["Johnson", "Smith", "Williams", "Greenwood", "Roper", "Willis", "Nicholson", "Wilson", "Bagshaw", "Oliver"];

var rnd = function (n) {
    var i = Math.random();
    var num = Math.floor(i * n + 1);
    return num;
};

var createUser = function (i) {
    var email = "testuser" + i + "@test.com";
    var first = fnames[rnd(fnames.length)];
    var last = lnames[rnd(lnames.length)];
    return {
      username: email,
      password: "",
      email: email,
      firstName: first,
      lastName: last
    };
};

// num: number of users
// callback(err, users): callback taking error and the array of users that have been created
var createUsers = e.createUsers = function (num, callback) {
    var count = 0;
    var users = new Array();
    async.whilst(
        function() { return count < num; },
        function (callback) {
            var user = createUser(count++);
            loqui.register(user, function (err, user) {
                if (!err)
                    users[count - 1] = user;
                callback(err);
            });
        },
        function (err) {
            // log error
            if (err)
                console.log(err);
            else {
                callback(null, users);
            }
        });
};

createUsers (10, function (err, users) {
    if (!err) {
        console.log("users created");
        loqui.solrCommit();
    }
});
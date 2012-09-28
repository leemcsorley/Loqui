var config = require('../utils/config');
var nano = require('nano')(config.couchdbAddress);
var async = require('async');
var fs = require('fs');
var http = require('http');
var solr = require('solr-client');

var db = nano.use(config.dbName);

var sclient = solr.createClient({ port: 8080 });

var e = exports;

var solrCommit = e.solrCommit = function() {
  sclient.commit({
      waitFlush: false,
      waitSearcher: false
  }, function(err, obj) {
    if (err)
        console.log(err);
    else
        console.log(obj);
  });
};

// gets a slim version of the supplied user, that can be included in other documents
// i.e partially denormalized
var smlUser = e.smlUser = function(user) {
    return {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
    };
};

// str: the search string
// callback(err, users) - the array of user objects
var searchUsers = e.searchUsers = function(str, callback) {
    var query = sclient.createQuery()
        .q({content_type: "user",
            keywords: "*" + str + "*" })
        .start(0)
        .rows(10);
    sclient.search(query, function(err, obj) {
       if (err)
            callback(err, null);
       else
            callback(null, obj.response.docs.map(function (doc) { return JSON.parse(doc.json); }));
    });
};

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

// post: the post object
// callback(err, post) - the post object saved into the database
var send = e.send = function (post, callback) {
    post.type = "post";
};

// user: the user object
// callback(err, user) - the user object saved into the database
var register = e.register = function (user, callback) {
    user.type = "user";
    getUserByUsername(user.username, function (err, user2) {
        if (!err) {
            if (!user2) {
                var pfileName = user.username.replace("@", "_") + ".png";
                // create profile picture - using identicon service
                http.get({ host: "localhost", port: 80, path: "/identicon/home" + "?str=" + user.username + "&size=50"}, function (res) {
                    var data = '';
                    res.setEncoding('binary');
                    res.on("data", function(chunk) { data += chunk; });
                    res.on("end", function() {
                       fs.writeFile(config.imageFilePath + "/" + pfileName, data, 'binary', function(err) {
                            if (err)
                                console.log(err);
                       });
                    });
                }).on("error", function(err) {
                    console.log(err.message);
                    });
                user.profileImgUrl = config.imageUrlPath + "/" + pfileName;
                db.insert(user, function (err, body) {
                    if (!err) {
                        user._id = body.id;         // set the id of the user object
                        // create the user record on SOLR
                        sclient.add({
                            id: user._id,
                            content_type: "user",
                            keywords: user.email + " " + user.firstName + " " + user.lastName,
                            json: JSON.stringify(smlUser(user))
                        }, function(err, obj) {
                            if (err)
                                console.log(err);
                            else
                                console.log(obj);
                        });
                    }
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
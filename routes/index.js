/*
 * GET home page.
 */

loqui = require('../logic/loqui');

exports.index = function (req, res) {
    res.render('index', { title:'Express' })
};

exports.send = function (req, res){
    req.contentType('json');
    // call back
    var postSuccess = function (err, post) {
        if (!err) req.send({ok: true, id: post._id});
        else req.send({ error: err });
    };
    // get current user
    loqui.getUserByUsername(req.session.username, function (err, user) {
        if (err || user == null) {
            // error getting user
            req.send({ error: ["error getting user", err ] });
        } else {
            // create the post object
            var post = {
                from: loqui.smlUser(user),
                to: new Array(),
                visibility: req.body.visibility,
                subject: req.body.subject,
                parent: req.body.parent,
                content: req.body.content,
                tags: req.body.tags
            };
            // get the "to" user ids
            if (req.to != null) {
                var toUsernames = req.body.to.split(",");
                var count = toUsernames.length;
                async.whilst(
                    function() { return count < toUsernames.length },
                    function(callback) {
                        loqui.getUserByUsername(toUsernames[count++], function (err, user) {
                            if (!err) post.to[count - 1] = loqui.smlUser(user);
                            callback(err);
                        });
                    },
                    function (err) {
                        if (!err) loqui.send(post, postSuccess);
                        else req.send({error:["error getting user", err]});
                    }
                );
            } else loqui.send(post, postSuccess);
        }
    });
};
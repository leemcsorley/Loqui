loqui = require('../logic/loqui');

var e = exports;

var login = e.login = function (req, res) {
    var post = req.body;
    loqui.login(post.username, post.password, function (err, user) {
        if (!err) {
            req.session.username = user.username;
            res.redirect('/');
        }
        else {
            res.locals.errors = err;
            res.redirect('/login');
        }
    });
};

var register = e.register = function (req, res) {
    post = req.body;
    if (post.password != post.password2) {
        res.send("passwords don't match");
    }
    else loqui.register({ username:post.email, firstName: post.first, lastName: post.last, password:post.password, email:post.email }, function (err, user) {
        if (!err) {
            req.session.username = post.username;
            res.redirect('/');
        }
        else {
            res.send('register failed' + err);
        }
    });
}
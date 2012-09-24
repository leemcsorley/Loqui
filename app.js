/**
 * Module dependencies.
 */

require("coffee-script");

var lessMiddleware = require('less-middleware');

var express = require('express')
    , config = require('./utils/config')
    , routes = require('./routes')
    , home = require('./routes/home')
    , account = require('./routes/account');

var app = module.exports = express.createServer();

// Configuration

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(lessMiddleware({
        src:__dirname + '/public',
        compress:true
    }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ secret:"string" }));
    app.use(app.router);

    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions:true, showStack:true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

function checkAuth(req, res, next) {
    if (!req.session.username) {
        res.send("You are not authorized to view this page");
    } else {
        next();
    }
}

// Routes
app.get('/', checkAuth, routes.index);
app.get('/home', home.home);
// account routes
app.get('/login', function (req, res) {
    res.render('account/login-full', { title:'Login', errors:res.locals.errors });
});
app.post('/login', account.login);
app.get('/register', function (req, res) {
    res.render('account/register', { title:'Register', errors:res.locals.errors });
});
app.post('/register', account.register);
app.get('/logout', function (req, res) {
    delete req.session.username;
    res.redirect('/login');
});

app.listen(3000, function () {
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

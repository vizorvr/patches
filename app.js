var _ = require('lodash');
var http = require('http');
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var csrf = require('lusca').csrf();
var methodOverride = require('method-override');

var MongoStore = require('connect-mongo')({ session: session });
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');
var exphbs  = require('express-handlebars');

var multer = require('multer');
var temp = require('temp').track();

var diyHbsHelpers = require('diy-handlebars-helpers');
var hbsHelpers = require('./utils/hbs-helpers');

// Framework controllers (see below for asset controllers)
var homeController = require('./controllers/home');
var editorController = require('./controllers/editor');
var userController = require('./controllers/user');

// API keys + Passport configuration
var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

var FrameDumpServer = require('./lib/framedump-server').FrameDumpServer;
var OscServer = require('./lib/osc-server').OscServer;
var WsChannelServer = require('./lib/wschannel-server').WsChannelServer;
var config = require('./config/config.json');

var argv = require('minimist')(process.argv.slice(2));

var ENGI = config.server.engiPath;
var PROJECT = argv._[0] || ENGI;

var listenHost = argv.i || config.server.host;
var listenPort = argv.p || config.server.port;

var hour = 3600000;
var day = hour * 24;
var week = day * 7;

var csrfExclude = [
	'/this-url-will-bypass-csrf'
];

mongoose.connect(secrets.db);
mongoose.connection.on('error', function()
{
	console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.');
});

var tempDir;
temp.mkdir('uploads', function(err, dirPath)
{
	if (err)
		throw err;
	tempDir = dirPath;	
});

var app = express();

app.set('port', process.env.PORT || 3000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
var hbs = exphbs.create({
	defaultLayout: 'main',
	helpers: _.extend(hbsHelpers, diyHbsHelpers)
})
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(compress());
app.use(connectAssets(
{
	paths: [
		path.join(__dirname, 'browser/style'),
		path.join(__dirname, 'browser/scripts')
	],
	helperContext: app.locals
}));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session(
{
	resave: true,
	saveUninitialized: true,
	secret: secrets.sessionSecret,
	store: new MongoStore(
	{
		url: secrets.db,
		auto_reconnect: true
	})
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// app.use(function(req, res, next)
// {
// 	// CSRF protection.
// 	if (_.contains(csrfExclude, req.path))
// 		return next();

// 	csrf(req, res, next);
// });

app.use(function(req, res, next)
{
	// Make user object available in templates.
	res.locals.user = req.user;
	next();
});

app.use(function(req, res, next)
{
	// Remember original destination before login.
	var path = req.path.split('/')[1];

	if (/auth||assets|login|logout|signup|img|fonts|favicon/i.test(path))
	{
		return next();
	}

	req.session.returnTo = req.path;

	next();
});

app.use(function(req, res, next)
{
	if(req.url.indexOf('?_') > -1)
		req.url = req.url.substring(0, req.url.indexOf('?_'));
	
	next();
});

app.use(express.static(path.join(__dirname, 'browser'), { maxAge: day }));
app.use('/node_modules', express['static'](path.join(__dirname, 'node_modules'), { maxAge: day }))
// TODO bundle precompiled templates for client
app.use('/views', express['static'](path.join(__dirname, 'views'), { maxAge: day }))

app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

app.get('/', homeController.index);
app.get('/editor', editorController.index);

// OAuth routes for sign-in.
/*
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
*/

// ----- MODEL ROUTES
// set no-cache headers for the rest
app.use(function(req, res, next)
{
	console.log('PATH', req.path)
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
	res.setHeader('Expires', 0);
	next();
});

app.use(errorHandler());

// Asset controllers
var GraphController = require('./controllers/graphController');
var ImageController = require('./controllers/imageController');

var GridFsStorage = require('./lib/gridfs-storage');
var gfs = new GridFsStorage();

var GraphService = require('./services/graphService');
var graphController = new GraphController(
	new GraphService(require('./models/graph')),
	gfs
);

var ImageService = require('./services/imageService');
var imageController = new ImageController(
	new ImageService(require('./models/image')),
	gfs
);

var controllers = {
	graph: graphController,
	image: imageController
}

function getController(req, res, next)
{
	req.controller = controllers[req.params.model];
	if (!req.controller)
		return res.status(404).send();

	next();
}

// stream file from fs/gridfs
app.get(/\/files\/.*/, function(req, res, next)
{
	req.path = req.path.replace(/^\/files/, '');
	return gfs.createReadStream(req.path)
	.on('error', next)
	.pipe(res);
});

// upload
app.use('/upload/:model', 
	getController, 
	passportConf.isAuthenticated,
	multer(
	{
		dest: tempDir,
		rename: function (fieldname, filename) {
			return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
		}
	}),
	function(req, res, next)
	{
		req.controller.upload(req, res, next);
	}
);

// list
app.get('/:model', getController, function(req, res, next)
{
	req.controller.index(req, res, next);
});

// get 
app.get('/:model/:id', getController, function(req, res, next)
{
	req.controller.load(req, res, next);
});

// save
app.post('/:model', getController,
	passportConf.isAuthenticated,
	function(req, res, next)
	{
		req.controller.validate(req, res, next);
	},
	function(req, res, next)
	{
		req.controller.save(req, res, next);
	}
);

if(config.server.enableFrameDumping)
{
	new FrameDumpServer().listen(app);
}

var httpServer = http.createServer(app);

httpServer.listen(listenPort, listenHost);

if (config.server.enableOSC)
{
	new OscServer().listen(httpServer);
}

if (config.server.enableChannels)
{
	new WsChannelServer().listen(httpServer);
}

app.use(errorHandler());

module.exports = app;

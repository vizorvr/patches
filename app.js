if (process.env.NEWRELIC)
	require('newrelic');

var _ = require('lodash');
var http = require('http');
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var connectAssets = require('connect-assets');
var sessions = require('client-sessions');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var errorHandler = require('errorhandler');
var csrf = require('lusca').csrf();
var methodOverride = require('method-override');
var crypto = require('crypto')

var GridFsStorage = require('./lib/gridfs-storage');

var flash = require('express-flash');

var fsPath = require('path');

var EventEmitter = require('events').EventEmitter;

var mongoose = require('mongoose');

var passport = require('passport');
var expressValidator = require('express-validator');
var exphbs  = require('express-handlebars');

var diyHbsHelpers = require('diy-handlebars-helpers');
var hbsHelpers = require('./utils/hbs-helpers');
var TemplateCache = require('./lib/templateCache');
var templateCache = new TemplateCache().compile();

// Framework controllers (see below for asset controllers)
var homeController = require('./controllers/home');
var userController = require('./controllers/userController');

var DocumentationController = require('./controllers/documentationController');
var documentationController = new DocumentationController();

// Threesixty site controller
var threesixtyController = require('./controllers/threesixty');

// API keys + Passport configuration
var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

var OscServer = require('./lib/osc-server').OscServer;
var WsChannelServer = require('./lib/wschannel-server').WsChannelServer;
var EditorChannelServer = require('./lib/editorChannelServer').EditorChannelServer;
var config = require('./config/config.json');

var argv = require('minimist')(process.argv.slice(2));

var listenHost = process.env.ENGI_BIND_IP || argv.i || config.server.host;
var listenPort = process.env.ENGI_BIND_PORT || argv.p || config.server.port;

var minute = 60 * 1000;
var hour = 60 * minute;
var day = hour * 24;
var week = day * 7;

var csrfExclude = [
	'/this-url-will-bypass-csrf'
];

var app = express();

app.events = new EventEmitter()

// view engine setup
app.set('views', fsPath.join(__dirname, 'views'));
var hbs = exphbs.create({
	defaultLayout: 'main',
	partialsDir: [
		{dir:'views/partials'},
		{dir:'views/server/partials', namespace: 'srv'}
	],
	helpers: _.extend(
		hbsHelpers,
		diyHbsHelpers,
		templateCache.helper()
	)
})
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(compress())
app.use(connectAssets({
	paths: [
		fsPath.join(__dirname, 'browser/style'),
		fsPath.join(__dirname, 'browser/scripts'),
		fsPath.join(__dirname, 'browser/dist')
	],
	helperContext: app.locals
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(bodyParser.json({
	limit: 1024 * 1024 * 128
}));
app.use(bodyParser.urlencoded( {
	extended: true,
	limit: 1024 * 1024 * 128
}));
app.use(expressValidator());
app.use(methodOverride());

app.use(cookieParser());
app.use(sessions({
	cookieName: 'vs070',
	requestKey: 'session',
	cookie: {
		domain: process.env.FQDN,
	},
	secret: secrets.sessionSecret,
	duration: week,
	activeDuration: day
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

app.use(function(req, res, next) {
	if (!req.user) {
		req.session.userId = crypto.randomBytes(12).toString('hex')
	} else {
		req.session.userId = req.user._id
	}

	res.locals.user = req.user;
	res.locals.KEY_GA = process.env.KEY_GA;
	res.locals.KEY_MIXPANEL = process.env.KEY_MIXPANEL;
	next();
});

app.use(function(req, res, next) {
	// Remember original destination before login.
	var path = req.path.split('/')[1];

	if (/auth||assets|login|logout|signup|img|fonts|favicon/i.test(path)) {
		return next();
	}

	req.session.returnTo = req.path;

	next();
});

// Return 404 instead of opening a new editor instance
// for old (pre-asm 2015) vizor experiences
// These are explicitly disabled so that links to old vizor experiences
// don't display a new editor page.
app.use(function(req, res, next) {
  // list of old vizor exprience ids (http://vizor.io/id)
	var disallowedPaths = [
		"m1Z1rgbbrfoj",
		"7QoQGaYKgfkv",
		"p7x4d4dnKf1G",
		"m1xg7KpelHAp",
		"QyvZxVz9nUkz",
		"WxAGbablMTZz",
		"yrx7nGxLQcge",
		"NqkY4O6vauLg",
		"JYW906AZbt9Z",
		"6ZgdNYeDZi2K",
		"h0p4lonG912",
		"hTgRn7Hj9LkG",
		"iK4tHiUb7K1k",
		"vrplanetchase",
		"vihartmonkeys",
		"hASd9e904vjr",
		"i3YxLp4XgQ7",
		"o1FxLjP5tW3Z",
		"2EuZis012ikL",
		"6ov3r4ND4D3z",
		"83jed8JAne93",
		"k3hf8ek4jfue",
		"oculusrex123",
		"riftsketch12",
		"streetview12",
		"he3jei29fjE7",
		"ue8JeioSleJa",
		"Ai4y2hI4jY06",
		"u49fE6zHXiEj",
		"j48xnto7psj2",
		"389cjto69djw",
		"hr84jshtwu39"];

  var path = req.url.split('/')[1];
	
  if (disallowedPaths.indexOf(path) > -1)
	{
		var err = new Error('Not found: '+path);
		err.status = 404;

		return next(err);
	}

	next();
});

app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*')
	if (req.headers['access-control-request-headers'])
		res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
	next();
});

app.use(function(req, res, next) {
	// redirect all create urls to vizor.io 
	if (req.hostname === 'create.vizor.io')
		return res.redirect(301, '//vizor.io'+req.url)

	next()
})

app.use(function(req, res, next)
{
	if(req.url.indexOf('?_') > -1)
		req.url = req.url.substring(0, req.url.indexOf('?_'));

	next();
});

// old static flat files
app.use('/data', express.static(
		fsPath.join(__dirname, 'browser', 'data'), 
		{ maxAge: week * 52 }
	)
)

// accounts

app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.post('/login.json', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);

app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.post('/account/exists', userController.checkUserName);
app.post('/account/email/exists', userController.checkEmailExists);

app.get('/account', passportConf.isAuthenticated, userController.getAccount)
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.get('/account/profile', passportConf.isAuthenticated, userController.getAccountProfile);

app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

// ----
// Documentation
app.get('/docs', documentationController
	.index.bind(documentationController))

app.get('/docs/plugins/:pluginName', documentationController
	.getPluginDocumentation.bind(documentationController))

switch (process.env.FQDN) {
	case '360vr.io':
	case '360.vizor.io':
		// 360 photo site
		app.get('/', threesixtyController.index);
		app.get('/featured', threesixtyController.featured)
		app.get('/v/:graph', function(req, res, next) {
			res.locals.layout = 'threesixty'
			next()
		})
	default:
		// default site
		app.get('/', homeController.index);
		app.get('/threesixty', threesixtyController.index);
		app.get('/threesixty/featured', threesixtyController.featured);
		break;
}

var gfs

mongoose.connect(secrets.db);
mongoose.connection.on('error', function(err) {
	throw err
})

mongoose.connection.on('connected', (connection) => {	
	gfs = new GridFsStorage('/data')
	gfs.on('ready', function() {
		setupModelRoutes(mongoose.connection.db)
	})
})

function setupModelRoutes(mongoConnection) {
	// stat() files in gridfs
	app.get(/^\/stat\/data\/.*/, function(req, res) {
		var path = req.path.replace(/^\/stat\/data/, '');

		gfs.stat(path)
		.then(function(stat) {
			if (!stat)
				return res.json({ error: 404 })

			delete stat._id

			res.header('Cache-Control', 'public')

			return res.json(stat)
		})
	})

	// stream files from fs/gridfs
	app.get(/^\/data\/.*/, function(req, res, next) {
		var path = req.path.replace(/^\/data/, '')
		var extname = fsPath.extname(path)
		var model = path.split('/')[1]
		var cacheControl = 'public'

		switch(model) {
			case 'dist':
			case 'graph':
				cacheControl = 'public, must-revalidate'
				break;
		}

		gfs.stat(path)
		.then(function(stat) {
			if (!stat)
				return res.status(404).send();

			if (req.header('If-None-Match') === stat.md5)
				return res.status(304).send();

			if (req.headers.range) {
				// stream partial file range
				var parts = req.headers.range.replace(/bytes=/, "").split("-");
				var partialstart = parts[0];
				var partialend = parts[1];

				// start&end offset are inclusive, end is optional
				var start = parseInt(partialstart, 10);
				var end = partialend ? parseInt(partialend, 10) : (stat.length - 1);

				var chunksize = (end - start) + 1;
				
				res.writeHeader(206, {
					'Content-Range': 'bytes ' + start + '-' + end + '/' + stat.length,
					'Accept-Ranges': 'bytes',
					'Cache-Control': cacheControl,
					'Content-Length': chunksize,
					'Content-Type': stat.contentType
				});

				var range = {startPos: start, endPos: end};
				gfs.createReadStream(path, range)
				.on('error', next)
				.pipe(res);
			}
			else {
				// stream whole file in a single request
				res.header('Content-Type', stat.contentType);

				// only accept range-requests on audio and video
				var rangeableTypes = ['.mp3', '.m4a', '.ogg', '.mp4', '.ogm', '.ogv']
				if (rangeableTypes.indexOf(extname) !== -1)
						res.header('Accept-Ranges', 'bytes')

				res.header('ETag', stat.md5);
				res.header('Content-Length', stat.length)
				res.header('Cache-Control', cacheControl)

				gfs.createReadStream(path)
				.on('error', next)
				.pipe(res)

			}
		})
		.catch(next)
	});

	app.get(/^\/dl\/.*/, function(req, res, next) {
		var path = req.path.replace(/^\/dl\/data/, '')

		gfs.stat(path)
		.then(function(stat) {
			if (!stat)
				return res.status(404).send();

			res.header('Content-Type', 'application/octet-stream');
			res.header('Content-Length', stat.length);

			return gfs.createReadStream(path)
			.on('error', next)
			.pipe(res);
		})
		.catch(next);
	});

	// allow strong caching for editor-*.min.js
	app.get([
		'/dist/editor-*.min.js',
		'/vendor/*',
		'/images/*',
		'/fonts/*',
		'/docs/*'
		], function(req, res, next) {
		res.setHeader('Cache-Control', 'public, max-age=604800');
		next();
	});

	// minimal caching for frequently updating things
	app.use([
		'/style/*',
		'/dist/player.min.js',
		'/plugins/plugins.json',
		'/presets/presets.json'
		],
		function(req, res, next) {
		res.setHeader('Cache-Control', 'public, must-revalidate, max-age=300');
		next();
	});

	if (process.env.NODE_ENV !== 'production') {
		app.use(function(req, res, next) {
			res.setHeader('Cache-Control', 'no-cache')
			next()
		})
	}

	app.use(['/node_modules'],
		express.static(fsPath.join(__dirname, 'node_modules'))
	);

	// static files
	app.use(express.static(fsPath.join(__dirname, 'browser'),
		{ maxAge: hour }))

	app.use('/common', express.static(fsPath.join(__dirname, 'common'),
		{ maxAge: hour }))

	// --------------------------------------------------

	/**
	  * wire up model routes
	  **/

	require('./modelRoutes.js')(
		app,
		gfs,
		mongoConnection,
		passportConf
	)

	// --------------------------------------------------

	var httpServer = http.createServer(app);
	httpServer.listen(listenPort, listenHost);

	if (config.server.enableOSC) {
		new OscServer().listen(httpServer);
	}

	if (config.server.enableChannels) {
		new WsChannelServer().listen(httpServer)
		var ecs = new EditorChannelServer()
		ecs.listen(httpServer)
	}

	app.use(function(err, req, res, next) {
		console.error(err.message, err.stack);

		res.status(err.status || 500);

		if (req.xhr)
			return res.json({ message: err.message });

		res.render('error', {
			layout: 'min',
			message: err.message,
			error: {}
		});
	});

	app.use(errorHandler());

	app.events.emit('ready')
}

module.exports = app;

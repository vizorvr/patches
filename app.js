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

var streamFile = require('./lib/streamFile');

var flash = require('express-flash');

var fsPath = require('path');

var EventEmitter = require('events').EventEmitter;

var mongoose = require('mongoose');
mongoose.Promise = global.Promise	// http://mongoosejs.com/docs/promises.html

var passport = require('passport');
var expressValidator = require('express-validator');
var exphbs  = require('express-handlebars');

var diyHbsHelpers = require('diy-handlebars-helpers');
var hbsHelpers = require('./lib/hbs-helpers');
var templateCache = require('./lib/templateCache').templateCache

// Framework controllers (see below for asset controllers)
var homeController = require('./controllers/homeController');
var userController = require('./controllers/userController');

// Threesixty site controller
var threesixtyController = require('./controllers/threesixty');

// API keys + Passport configuration
var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

var OscServer = require('./lib/osc-server').OscServer;
var WsChannelServer = require('./lib/wschannel-server').WsChannelServer;
var EditorChannelServer = require('./lib/editorChannelServer').EditorChannelServer;
var config = require('./config/config.js');

let CloudFileSystemImpl
if (config.server.useCDN)
 	CloudFileSystemImpl = require('./lib/cloudStorage')
else
	CloudFileSystemImpl = require('./lib/gridfs-storage')

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

// keep track of process startup time
process.startTime = Date.now()

app.events = new EventEmitter()

// view engine setup
app.set('views', fsPath.join(__dirname, 'views'));

var releaseMode = process.env.NODE_ENV === 'production'

var hbs = exphbs.create({
	defaultLayout: releaseMode ? 'main-bundled' : 'main',
	partialsDir: [
		{dir:'views/partials'},
		{dir:'views/server/partials', namespace: 'srv'}
	],
	helpers: _.extend(
		diyHbsHelpers,
		hbsHelpers,
		templateCache.helper()
	)
})

templateCache.setHbs(hbs.handlebars)
templateCache.compile()

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use((req,res,next) => {	// allow some context through to handlebars engine/helpers automatically
	hbs.handlebars._request = {}
	for (var key of ['hostname', 'ip', 'query', 'headers', 'method', 'params', 'secure', 'xhr', 'url', 'originalUrl']) {
		hbs.handlebars._request[key] = Object.freeze(_.extend(req[key]))
	}
	Object.freeze(hbs.handlebars._request)
	next()
})

app.use(compress())
app.use(connectAssets({
	paths: [
		fsPath.join(__dirname, 'browser/style')
	],
	helperContext: app.locals
}));

if (!releaseMode)
	app.use(morgan('dev'))

app.use(bodyParser.json({
	limit: 1024 * 1024 * 128
}));
app.use(bodyParser.urlencoded( {
	extended: true,
	limit: 1024 * 1024 * 128
}));
app.use(expressValidator());
app.use(methodOverride());

// parse the domain out from the FQDN and use it as the cookie domain
// this way 360.vizor.io and vizor.io will use the same cookie
var fqdn = process.env.FQDN || ''
var domainFromFqdn = fqdn.split('.').splice(-2).join('.')
app.use(cookieParser());
app.use(sessions({
	cookieName: 'vs070',
	requestKey: 'session',
	cookie: {
		domain: domainFromFqdn,
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

	res.locals.user = req.user
	res.locals.KEY_MIXPANEL = process.env.KEY_MIXPANEL
	res.locals.KEY_GTM = process.env.KEY_GTM
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

app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*')
	if (req.headers['access-control-request-headers'])
		res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
	next();
});

app.use(function(req, res, next) {
	if (req.url.indexOf('?_') > -1)
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

app.get('/about', homeController.about)

// begin 360 routing
app.get('/v/:graph', function(req, res, next) {
	switch (req.hostname) {
		case '360.vizor.io':
		case '360.vizor.lol':
			res.locals.layout = 'threesixty'
	}
	next()
})

app.get('/featured', function(req, res, next) {
	switch (req.hostname) {
		case '360.vizor.io':
		case '360.vizor.lol':
			return threesixtyController.featured(req, res, next)
		default:
			return next()
	}
})

app.get('/', function(req, res, next) {
	switch (req.hostname) {
		case '360.vizor.io':
		case '360.vizor.lol':
			return threesixtyController.index(req, res, next)
		default:
			return homeController.index(req, res, next)
	}
})

app.get('/threesixty', threesixtyController.index)
app.get('/threesixty/featured', threesixtyController.featured)

// end 360 routing

mongoose.connect(secrets.db);
mongoose.connection.on('error', function(err) {
	throw err
})

mongoose.connection.on('connected', (connection) => {
	setupModelRoutes(mongoose.connection.db)
})

function setupModelRoutes(mongoConnection) {
	var modelRoutes = require('./modelRoutes.js')
	const cloudStorage = new CloudFileSystemImpl()

	// stat() files in cloud storage
	app.get(/^\/stat\/.*/, function(req, res) {
		var path = req.path.replace(/^\/stat/, '');

		cloudStorage.stat(path)
		.then(function(stat) {
			if (!stat)
				return res.json({ error: 404 })

			delete stat._id

			res.header('Cache-Control', 'public')

			return res.json(stat)
		})
	})

	// get files from cloud storage
	app.get(/^\/data\/.*/, function(req, res, next) {
		if (config.server.useCDN) {
			const cdnPath = req.path.substring('/data'.length)
			return res.redirect(301, config.server.cdnRoot + cdnPath)
		} else {
			return streamFile(req, res, next, cloudStorage)
			.catch(next)
		}
	});

	// allow strong caching for bundles etc.
	app.get([
		'/dist/*',
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
		'/plugins/plugins.json',
		'/vizor/patches', // system patch list
		],
		function(req, res, next) {
			res.setHeader('Cache-Control', 'public, must-revalidate, max-age=300');
			next();
		}
	);

	if (!releaseMode) {
		app.use(function(req, res, next) {
			res.setHeader('Cache-Control', 'no-cache')
			next()
		})
	}

	// drop the second parameter (timestamp) in meta-scripts
	app.use('/meta-scripts', function(req, res, next) {
		req.url = '/' + req.url.split('/').splice(2).join('/')
		next()
	}, express.static(
		fsPath.join(__dirname, 'browser', 'scripts'),
		{ maxAge: week * 52 }
	))

	app.use(['/node_modules'],
		express.static(fsPath.join(__dirname, 'node_modules'))
	)

	app.use(express.static(fsPath.join(__dirname, 'browser'),
		{ maxAge: hour }))

	// remap /scripts to /dist in production
	app.use('/scripts', express.static(
			fsPath.join(__dirname, 'browser', 'dist'),
			{ maxAge: week * 52 }
		)
	)

	app.use('/common', express.static(fsPath.join(__dirname, 'common'),
		{ maxAge: hour }))

	// --------------------------------------------------

	/**
	  * wire up model routes
	  **/

	modelRoutes.setupDefaultRoutes(
		app,
		cloudStorage,
		mongoConnection,
		passportConf
	)

	// --------------------------------------------------

	var httpServer = http.createServer(app)
	httpServer.listen(listenPort, listenHost)

	if (config.server.enableOSC)
		new OscServer().listen(httpServer)

	if (config.server.enableChannels) {
		new WsChannelServer().listen(httpServer)
		var ecs = new EditorChannelServer()
		ecs.listen(httpServer)
	}

	app.use(function(err, req, res, next) {
		console.error(err.message, err.stack);

		res.status(err.status || 500);

		if (req.xhr)
			return res.json({ success: false, message: err.message });

		res.render('error', {
			layout: 'errorlayout',
			message: err.message,
			error: {}
		});
	});

	app.use(errorHandler());

	app.events.emit('ready')
}

module.exports = app;

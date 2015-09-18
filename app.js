if (process.env.NEWRELIC)
	require('newrelic');

var _ = require('lodash');
var http = require('http');
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var sessions = require('client-sessions');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var errorHandler = require('errorhandler');
var csrf = require('lusca').csrf();
var methodOverride = require('method-override');
var crypto = require('crypto')

var flash = require('express-flash');
var path = require('path');

var EventEmitter = require('events').EventEmitter;

var mongoose = require('mongoose');
var r = require('rethinkdb')

var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');
var exphbs  = require('express-handlebars');

var multer = require('multer');
var temp = require('temp').track();

var diyHbsHelpers = require('diy-handlebars-helpers');
var hbsHelpers = require('./utils/hbs-helpers');
var TemplateCache = require('./lib/templateCache');
var templateCache = new TemplateCache().compile();

// Framework controllers (see below for asset controllers)
var homeController = require('./controllers/home');
var userController = require('./controllers/user');

// API keys + Passport configuration
var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

var OscServer = require('./lib/osc-server').OscServer;
var WsChannelServer = require('./lib/wschannel-server').WsChannelServer;
var EditorChannelServer = require('./lib/editorChannelServer').EditorChannelServer;
var config = require('./config/config.json');

var argv = require('minimist')(process.argv.slice(2));

var ENGI = config.server.engiPath;

var listenHost = process.env.ENGI_BIND_IP || argv.i || config.server.host;
var listenPort = process.env.ENGI_BIND_PORT || argv.p || config.server.port;

var minute = 60 * 1000;
var hour = 60 * minute;
var day = hour * 24;
var week = day * 7;

var csrfExclude = [
	'/this-url-will-bypass-csrf'
];

var tempDir;
temp.mkdir('uploads', function(err, dirPath)
{
	if (err)
		throw err;
	tempDir = dirPath;
});

var app = express();

app.events = new EventEmitter()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
var hbs = exphbs.create({
	defaultLayout: 'main',
	helpers: _.extend(
		hbsHelpers,
		diyHbsHelpers,
		templateCache.helper()
	)
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

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(bodyParser.json(
{
	limit: 1024 * 1024 * 128
}));
app.use(bodyParser.urlencoded(
{
	extended: true,
	limit: 1024 * 1024 * 128
}));
app.use(expressValidator());
app.use(methodOverride());

app.use(cookieParser());
app.use(sessions({
	cookieName: 'session',
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

app.use(function(req, res, next)
{
	if (!req.user)
		req.session.userId = crypto.randomBytes(12).toString('hex')
	else
		req.session.userId = req.user._id

	res.locals.user = req.user;
	res.locals.KEY_GA = process.env.KEY_GA;
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

// Return 404 instead of opening a new editor instance
// for old (pre-asm 2015) vizor experiences
// These are explicitly disabled so that links to old vizor experiences
// don't display a new editor page.
app.use(function(req, res, next)
{
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
app.use('/data', express.static(path.join(__dirname, 'browser', 'data'), { maxAge: week * 52 }));

var rethinkConnection
var rethinkDbName = process.env.RETHINKDB_NAME || 'vizor'
r.connect({
	host: process.env.RETHINKDB_HOST || 'localhost',
	port: 28015,
	db: rethinkDbName
}, function(err, conn) {
	if (err)
		throw err

	console.log('RethinkDB connected')

	rethinkConnection = conn

	mongoose.connect(secrets.db);
	mongoose.connection.on('error', function(err) {
		throw err
	});


	// stat() files in gridfs
	app.get(/^\/stat\/data\/.*/, function(req, res) {
		var path = req.path.replace(/^\/stat\/data/, '');

		gfs.stat(path)
		.then(function(stat) {
			if (!stat)
				return res.json({ error: 404 })

			delete stat._id

			return res.json(stat)
		})
	})

	// stream files from fs/gridfs
	app.get(/^\/data\/.*/, function(req, res, next) {
		var path = req.path.replace(/^\/data/, '');

		gfs.stat(path)
		.then(function(stat)
		{
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
					'Cache-Control': 'public, must-revalidate, max-age=86400',
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
				res.header('Accept-Ranges', 'bytes');
				res.header('ETag', stat.md5);
				res.header('Content-Length', stat.length)
				res.header('Cache-Control', 'public, must-revalidate, max-age=86400');

				gfs.createReadStream(path)
				.on('error', next)
				.pipe(res);
			}
		})
		.catch(next)
	});

	app.get(/^\/dl\/.*/, function(req, res, next)
	{
		var path = req.path.replace(/^\/dl\/data/, '');

		gfs.stat(path)
		.then(function(stat)
		{
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

	// set no-cache headers by default
	app.use(function(req, res, next) {
		res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
		res.setHeader('Expires', 0);
		next();
	});

	// allow caching editor-*.min.js
	app.get([
		'/scripts/editor-*.min.js',
		'/vendor/*',
		'/fonts/*',
		], function(req, res, next) {
		res.setHeader('Cache-Control', 'public, max-age=604800');
		next();
	});

	// allow some caching for node modules, app images and styles
	app.use([
		'/node_modules',
		'/images/*',
		'/style/*',
		'/plugins/plugins.json',
		'/plugins/all.plugins.js'
		],
		function(req, res, next) {
		res.setHeader('Cache-Control', 'must-revalidate, max-age=300');
		next();
	});

	app.use(['/node_modules'], express.static(path.join(__dirname, 'node_modules')));

	// static files
	app.use(express.static(path.join(__dirname, 'browser'), { maxAge: 0 }));

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
	app.get('/account', passportConf.isAuthenticated, userController.getAccount);
	app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
	app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
	app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
	app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

	app.get('/', homeController.index);


	// ----- MODEL ROUTES

	// Asset controllers
	var AssetController = require('./controllers/assetController');
	var GraphController = require('./controllers/graphController');
	var ImageController = require('./controllers/imageController');
	var SceneController = require('./controllers/sceneController');
	var PresetController = require('./controllers/presetController');

	var GridFsStorage = require('./lib/gridfs-storage');
	var gfs = new GridFsStorage('/data');

	var AssetService = require('./services/assetService');
	var GraphService = require('./services/graphService');

	var graphController = new GraphController(
		new GraphService(require('./models/graph'), gfs),
		gfs,
		rethinkConnection
	);

	var imageController = new ImageController(
		new AssetService(require('./models/image')),
		gfs
	);

	var sceneController = new SceneController(
		new AssetService(require('./models/scene')),
		gfs
	);

	var AudioModel = require('./models/audio');
	var audioController = new AssetController(
		AudioModel,
		new AssetService(AudioModel),
		gfs
	);

	var VideoModel = require('./models/video');
	var videoController = new AssetController(
		VideoModel,
		new AssetService(VideoModel),
		gfs
	);

	var presetController = new PresetController(
		new AssetService(require('./models/preset')),
		gfs
	);

	var JsonModel = require('./models/json');
	var jsonController = new AssetController(
		JsonModel,
		new AssetService(JsonModel),
		gfs
	);

	var controllers = {
		graph: graphController,
		image: imageController,
		scene: sceneController,
		audio: audioController,
		video: videoController,
		json: jsonController,

		preset: presetController
	}

	function getController(req, res, next)
	{
		req.controller = controllers[req.params.model];
		next();
	}

	function requireController(req, res, next) {
		req.controller = controllers[req.params.model];
		if (!req.controller) {
			var e = new Error('Not found: '+req.path);
			e.status = 404;
			return next(e);
		}
		next();
	}

	// upload
	app.post('/upload/:model',
		requireController,
		passportConf.isAuthenticated,
		multer(
		{
			dest: tempDir,
			limits: {
				fileSize: 1024 * 1024 * 128 // 128m
			},
			rename: function (fieldname, filename)
			{
				return filename.replace(/\W+/g, '-');
			}
		}),
		function(req, res, next)
		{
			// imageProcessor will checksum the file
			if (req.params.model === 'image')
				return next();

			req.controller.checksumUpload(req, res, next);
		},
		function(req, res, next)
		{
			req.controller.canWriteUpload(req, res, next);
		},
		function(req, res, next)
		{
			req.controller.upload(req, res, next);
		}
	);

	// -----
	// Preset routes
	app.get('/:username/presets', function(req, res, next) {
		presetController.findByCreatorName(req, res, next);
	})
	app.post('/:username/presets', function(req, res, next) {
		presetController.save(req, res, next);
	})

	// -----
	// Graph routes

	app.get(['/editor', '/edit'], graphController.edit.bind(graphController));

	// GET /fthr/dunes-world/edit -- EDITOR
	app.get('/:username/:graph/edit', function(req, res, next)
	{
		res.redirect('/'+req.params.username+'/'+req.params.graph)
	});

	// GET /fthr/dunes-world.json
	app.get('/:username/:graph.json', function(req, res, next)
	{
		req.params.path = '/'+req.params.username+'/'+req.params.graph.replace(/\.json$/g, '');
		console.log('load', req.params.path)
		graphController.load(req, res, next);
	});

	// GET /fthr/dunes-world
	app.get('/:username/:graph', function(req, res, next)
	{
		req.params.path = '/'+req.params.username+'/'+req.params.graph;
		graphController.graphLanding(req, res, next);
	});

	// GET /fthr/dunes-world/graph.json
	app.get('/:username/:graph/graph.json', function(req, res, next)
	{
		req.params.path = '/'+req.params.username+'/'+req.params.graph.replace(/\.json$/g, '');

		graphController.stream(req, res, next);
	});

	// -----
	// Generic model routes

	// list
	app.get(['/graph', '/graphs', '/graphs.json', '/graph.json'], function(req,res,next)
	{
		graphController.index(req, res, next);
	});

	app.get('/:model', getController, function(req, res, next)
	{
		if (!req.controller)
			return graphController.userIndex(req, res, next);

		requireController(req, res, function(err)
		{
			if (err)
				return next(err);

			return req.controller.index(req, res, next);
		});
	});

	// list by tag
	app.get('/:model/tag/:tag', requireController, function(req, res, next)
	{
		req.controller.findByTag(req, res, next);
	});

	// get
	app.get('/:model/:id', requireController, function(req, res, next)
	{
		req.controller.load(req, res, next);
	});

	// save
	app.post('/:model',
		requireController,
		passportConf.isAuthenticated,
		function(req, res, next)
		{
			req.controller.save(req, res, next);
		}
	);

	// last resort Graph URLs

	// GET /ju63
	app.get('/:path', function(req, res, next) {
		req.params.path = '/'+req.params.path;
		graphController.edit(req, res, next);
	});

	// --------------------------------------------------


	var httpServer = http.createServer(app);
	httpServer.listen(listenPort, listenHost);

	if (config.server.enableOSC) {
		new OscServer().listen(httpServer);
	}

	if (config.server.enableChannels) {
		new WsChannelServer().listen(httpServer)
		var ecs = new EditorChannelServer(rethinkConnection)
		ecs.listen(httpServer)
	}

	app.use(function(err, req, res) {
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
})

module.exports = app;

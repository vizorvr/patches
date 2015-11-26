var temp = require('temp').track();
var multer = require('multer');

var tempDir;
temp.mkdir('uploads', function(err, dirPath)
{
	if (err)
		throw err;
	tempDir = dirPath;
});

module.exports = 
function modelRoutes(
	app,
	gfs,
	rethinkConnection,
	passportConf
){
	// ----- MODEL ROUTES

	// Asset controllers
	var AssetController = require('./controllers/assetController');
	var GraphController = require('./controllers/graphController');
	var ImageController = require('./controllers/imageController');
	var SceneController = require('./controllers/sceneController');
	var PresetController = require('./controllers/presetController');

	var AssetService = require('./services/assetService');
	var GraphService = require('./services/graphService');

	var EditLogController = require('./controllers/editLogController');

	var editLogController = new EditLogController()

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
		multer({
			dest: tempDir,
			limits: {
				fileSize: 1024 * 1024 * 128 // 128m
			},
			rename: function (fieldname, filename) {
				return filename.replace(/\W+/g, '-');
			}
		}),
		function(req, res, next) {
			// imageProcessor will checksum the file
			if (req.params.model === 'image')
				return next()

			req.controller.checksumUpload(req, res, next)
		},
		function(req, res, next) {
			req.controller.canWriteUpload(req, res, next)
		},
		function(req, res, next) {
			req.controller.upload(req, res, next)
		}
	);

	// -----
	// Edit Log routes
	app.get('/editlog', function(req, res, next) {
		return editLogController.userIndex(req, res, next)
	})

	app.get('/editlog/:channelName', function(req, res, next) {
		return editLogController.show(req, res, next)
	})

	app.post('/editlog/:channelName', function(req, res, next) {
		return editLogController.save(req, res, next)
	})

	app.post('/editlog/:channelName/join', function(req, res, next) {
		return editLogController.join(req, res, next)
	})

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
	app.get('/:username/:graph/edit', function(req, res, next) {
		req.params.path = '/'+req.params.username+'/'+req.params.graph;
		graphController.edit(req, res, next);
	});

	// GET /fthr/dunes-world -- PLAYER
	app.get('/:username/:graph', function(req, res, next) {
		req.params.path = '/'+req.params.username+'/'+req.params.graph;
		graphController.graphLanding(req, res, next);
	});

	// GET /fthr/dunes-world.json
	app.get('/:username/:graph.json', function(req, res, next) {
		req.params.path = '/'+req.params.username+'/'+req.params.graph.replace(/\.json$/g, '');
		console.log('load', req.params.path)
		graphController.load(req, res, next);
	});

	// GET /fthr/dunes-world/graph.json
	app.get('/:username/:graph/graph.json', function(req, res, next) {
		req.params.path = '/'+req.params.username+'/'+req.params.graph.replace(/\.json$/g, '');
		graphController.stream(req, res, next);
	});

	// -----
	// Generic model routes

	// latest ("I'm feeling lucky")
	app.get('/graph/latest', function(req,res,next) {
		graphController.latest(req, res, next)
	})

	// list
	app.get(['/graph', '/graphs', '/graphs.json', '/graph.json'], function(req,res,next){
		graphController.index(req, res, next)
	})

	// list own assets
	app.get('/:model', getController, function(req, res, next) {
		if (!req.controller)
			return graphController.userIndex(req, res, next)

		requireController(req, res, function(err) {
			if (err)
				return next(err)

			return req.controller.userIndex(req, res, next)
		})
	})

	// list user assets
	app.get(['/:username/assets/:model', '/:username/assets/:model.json'], getController, function(req, res, next) {
		requireController(req, res, function(err) {
			if (err)
				return next(err)

			return req.controller.userIndex(req, res, next)
		})
	})

	// list by tag
	app.get('/:model/tag/:tag', requireController, function(req, res, next) {
		req.controller.findByTag(req, res, next)
	})

	// get
	app.get('/:model/:id', requireController, function(req, res, next) {
		req.controller.load(req, res, next)
	})

	// save
	app.post('/:model',
		requireController,
		passportConf.isAuthenticated,
		function(req, res, next) {
			req.controller.save(req, res, next)
		}
	)

	// last resort Graph URLs

	// GET /ju63
	app.get('/:path', function(req, res, next) {
		req.params.path = '/'+req.params.path
		graphController.edit(req, res, next)
	})

}

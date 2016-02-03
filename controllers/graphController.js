var _ = require('lodash')
var Graph = require('../models/graph')
var AssetController = require('./assetController')
var fsPath = require('path')
var assetHelper = require('../models/asset-helper')
var templateCache = new(require('../lib/templateCache'))
var helper = require('./controllerHelpers')
var isStringEmpty = require('../lib/stringUtil').isStringEmpty
var PreviewImageProcessor = require('../lib/previewImageProcessor');

var EditLog = require('../models/editLog')

function makeRandomPath() {
	var keys = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
	var uid = ''
	for (var i=0; i < 12; i++) {
		uid += keys[Math.floor(Math.random() * keys.length)]
	}
	return uid
}

function GraphController(s, gfs, rethinkConnection) {
	var args = Array.prototype.slice.apply(arguments);
	args.unshift(Graph);
	AssetController.apply(this, args);
	this.rethinkConnection = rethinkConnection

	this.previewImageProcessor = new PreviewImageProcessor()
}

GraphController.prototype = Object.create(AssetController.prototype);

GraphController.prototype.userIndex = function(req, res, next) {
	var wantJson = req.xhr;
	this._service.userGraphs(req.params.model)
	.then(function(list)
	{
		if (!list || !list.length)
			return next();

		var data = {
			profile: {
				username: req.params.model
			},
			graphs: list
		};

		if (wantJson) {
			return res.status(200).json(helper.responseStatusSuccess("OK", data));
		}

		_.extend(data, {
			meta : {
				title: 'Graphs',
				bodyclass: 'bUserpage',
				scripts : ['site/userpages.js']
			}
		});
		res.render('server/pages/userpage', data);
	});
}

// GET /graph
GraphController.prototype.index = function(req, res) {
	this._service.minimalList()
	.then(function(list)
	{
		if (req.xhr || req.path.slice(-5) === '.json')
			return res.json(list);

		res.render('graph/index',
		{
			layout: 'min',
			graphs: list,
			title: 'Graphs'
		});
	});
}

function renderEditor(res, graph, hasEdits) {
	var releaseMode = process.env.NODE_ENV === 'production'
	var layout = releaseMode ? 'editor-prod' : 'editor'
	
	res.header('Cache-control', 'no-cache, must-revalidate, max-age=0')

	function respond() {
		res.render('editor', {
			layout: layout,
			graph: graph,
			hasEdits: hasEdits,
			releaseMode: releaseMode
		});
	}

	if (!releaseMode) {
		templateCache.recompile(function() {
			respond()
		})
	}
	else
		respond()
}

// GET /fthr/dunes-world/edit
GraphController.prototype.edit = function(req, res, next) {
	var that = this

	if (!req.params.path) {
		return res.redirect('/' + makeRandomPath())
	}

	this._service.findByPath(req.params.path)
	.then(function(graph) {
		EditLog.hasEditsByName(that.rethinkConnection, req.params.path.substring(1))
		.then(function(hasEdits) {
			renderEditor(res, graph, hasEdits)
		})
	})
	.catch(next)
}


// GET /latest-graph
GraphController.prototype.latest = function(req, res) {
	this._service.list()
	.then(function(list) {
		res.redirect(list[0].path)
	});
}

// GET /embed/fthr/dunes-world
GraphController.prototype.embed = function(req, res, next) {
	this._service.findByPath(req.params.path)
	.then(function(graph) {
		if (!graph)
			return next()

		res.render('graph/show', {
			layout: 'player',
			autoplay: false,
			graph: graph,
			graphMinUrl: graph.url
		})
	}).catch(next)
}

// GET /fthr/dunes-world
GraphController.prototype.graphLanding = function(req, res, next) {
	this._service.findByPath(req.params.path)
	.then(function(graph) {
		if (!graph)
			return next()

		// Get displayed values for graph and owner
		// 'this-is-a-graph' => 'This Is A Graph'
		var graphName = graph.name.split('-')
			.map(s => s.charAt(0).toUpperCase() + s.slice(1))
			.join(' ');
		// Figure out if the graph owner has a fullname
		// Use that if does, else use the username for display
		var graphOwner;
		var creator = graph._creator;
		if (creator.name && !isStringEmpty(creator.name)) {
			graphOwner = creator.name;
		} else {
			graphOwner = graph.owner;
		}
		
		res.render('graph/show', {
			layout: 'player',
			graph: graph,
			graphMinUrl: graph.url,
			autoplay: true,
			graphName: graphName,
			graphOwner: graphOwner,
			previewImage: 'http://' + req.headers.host + graph.previewUrlLarge,
			previewImageWidth: 1280,
			previewImageHeight: 720
		})
	}).catch(next)
}

// GET /fthr/dunes-world/graph.json
GraphController.prototype.stream = function(req, res, next)
{
	var that = this;

	this._service.findByPath(req.params.path)
	.then(function(item)
	{
		that._fs.createReadStream(item.url)
		.pipe(res)
		.on('error', next);
	})
	.catch(next);
};

GraphController.prototype._makePath = function(req, path)
{
	return '/' + req.user.username
		+ '/' + assetHelper.slugify(fsPath.basename(path, fsPath.extname(path)));
}

GraphController.prototype.canWriteUpload = function(req, res, next)
{
	var that = this;

	if (!req.files)
		return next(new Error('No files uploaded'));

	var file = req.files.file;
	var dest = this._makePath(req, file.path);

	that._service.canWrite(req.user, dest)
	.then(function(can)
	{
		if (!can)
			return res.status(403)
				.json({message: 'Sorry, permission denied'});

		next();
	});
} 

// POST /graph with file upload
GraphController.prototype.upload = function(req, res, next)
{
	var that = this;

	var file = req.files.file;

	if (fsPath.extname(file.path) !== '.json')
		return next(new Error('The upload is not a graph JSON! Are you sure you are trying to upload a graph?'))

	var path = this._makePath(req, file.path);
	var gridFsPath = '/graph'+path+'.json';

	// move the uploaded file into GridFS / local FS
	return that._fs.move(file.path, gridFsPath)
	.then(function(url)
	{
		return that._service.findByPath(path)
		.then(function(model)
		{
			if (!model)
				model = { path: path };

			model.url = url;

			// save/update the model
			return that._service.save(model, req.user)
			.then(function(asset)
			{
				res.json(asset);
			});
		});
	})
	.catch(function(err)
	{
		return next(err);
	});
};

// POST /graph
GraphController.prototype.save = function(req, res, next) {
	var that = this;
	var path = this._makePath(req, req.body.path);
	var gridFsGraphPath = '/graph'+path+'.json';

	var gridFsOriginalImagePath = '/previews'+path+'-preview-original.png'

	var previewImageSpecs = [{
		gridFsPath: '/previews'+path+'-preview-440x330.png',
		width: 440,
		height: 330
	}, {
		gridFsPath: '/previews'+path+'-preview-1280x720.png',
		width: 1280,
		height: 720,
	}]

	var tags = that._parseTags(req.body.tags);

	this._service.canWrite(req.user, path)
	.then(function(can) {
		if (!can) {
			return res.status(403)
				.json({message: 'Sorry, permission denied'});
		}

		return that._fs.writeString(gridFsGraphPath, req.body.graph)
		.then(function() {
			if (!req.body.previewImage) {
				return
			}

			// save original image (if we ever need to batch process any of these)
			return that._fs.writeString(gridFsOriginalImagePath, req.body.previewImage.replace(/^data:image\/\w+;base64,/, ""), 'base64')
			.then(function() {
				// create preview images
				return that.previewImageProcessor.process(path, req.body.previewImage, previewImageSpecs)
				.then(function(processedImages) {
					if (processedImages && processedImages.length === 2) {
						// write small image
						return that._fs.writeString(previewImageSpecs[0].gridFsPath, processedImages[0], 'base64')
						.then(function() {
							// write large image
							that._fs.writeString(previewImageSpecs[1].gridFsPath, processedImages[1], 'base64')
						})
					}
				})
			})
		})
		.then(function() {
			var url = that._fs.url(gridFsGraphPath);
			var previewUrlSmall = that._fs.url(previewImageSpecs[0].gridFsPath)
			var previewUrlLarge = that._fs.url(previewImageSpecs[1].gridFsPath)

			var model = {
				path: path,
				tags: tags,
				url: url,
				previewUrlSmall: previewUrlSmall,
				previewUrlLarge: previewUrlLarge
			}

			return that._service.save(model, req.user)
			.then(function(asset) {
				res.json(asset)
			})
		})
	})
	.catch(next)
}

module.exports = GraphController;

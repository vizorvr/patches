var Graph = require('../models/graph');
var AssetController = require('./assetController');
var fsPath = require('path');
var templateCache = new(require('../lib/templateCache'));
var assetHelper = require('../models/asset-helper');

function makeRandomPath() {
	var keys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
	var uid = ''
	for (var i=0; i < 12; i++) {
		uid += keys[Math.floor(Math.random() * keys.length)]
	}
	return uid
}

function GraphController(graphService, fs) {
	var args = Array.prototype.slice.apply(arguments);
	args.unshift(Graph);
	AssetController.apply(this, args);
};

GraphController.prototype = Object.create(AssetController.prototype);

// GET /fthr
GraphController.prototype.userIndex = function(req, res, next)
{
	this._service.userGraphs(req.params.model)
	.then(function(list)
	{
		if (!list || !list.length)
			return next();

		res.render('graph/index',
		{
			layout: 'min',
			graphs: list,
			title: 'Graphs'
		});
	});
}

// GET /graph
GraphController.prototype.index = function(req, res, next)
{

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


function renderEditor(res, graph) {
	var layout = process.env.NODE_ENV === 'production' ? 'editor-prod' : 'editor'
	function respond() {
		res.render('editor', {
			layout: layout,
			graph: graph
		});
	}

	if (process.env.NODE_ENV !== 'production') {
		templateCache.recompile(function() {
			respond()
		})
	}
	else
		respond()
}

// GET /fthr/dunes-world/edit
GraphController.prototype.edit = function(req, res, next) {
	if (!req.params.path) {
		return res.redirect('/' + makeRandomPath())
	}

	this._service.findByPath(req.params.path)
	.then(function(graph) {
		renderEditor(res, graph)
	})
	.catch(next)
}

// GET /fthr/dunes-world
GraphController.prototype.graphLanding = function(req, res, next) {
	this._service.findByPath(req.params.path)
	.then(function(graph) {
		if (!graph)
			return next();

		renderEditor(res, graph)
	}).catch(next);
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
GraphController.prototype.save = function(req, res, next)
{
	var that = this;
	var path = this._makePath(req, req.body.path);
	var gridFsPath = '/graph'+path+'.json';

	var tags = that._parseTags(req.body.tags);

	this._service.canWrite(req.user, path)
	.then(function(can)
	{
		if (!can)
		{
			return res.status(403)
				.json({message: 'Sorry, permission denied'});
		}

		return that._fs.writeString(gridFsPath, req.body.graph)
		.then(function()
		{
			var url = that._fs.url(gridFsPath);

			var model =
			{
				path: path,
				tags: tags,
				url: url
			};

			return that._service.save(model, req.user)
			.then(function(asset)
			{
				res.json(asset);
			});
		});	
	})
	.catch(next);
}

module.exports = GraphController;

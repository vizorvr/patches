var Graph = require('../models/graph');
var AssetController = require('./assetController');
var streamBuffers = require('stream-buffers');
var fsPath = require('path');

function GraphController(graphService, fs)
{
	var args = Array.prototype.slice.apply(arguments);
	args.unshift(Graph);
	AssetController.apply(this, args);
};

GraphController.prototype = Object.create(AssetController.prototype);

// GET /fthr/dunes-world/edit
GraphController.prototype.edit = function(req, res, next)
{
	this._service.findByPath(req.params.path)
	.then(function(graph) {
		res.render('editor',
		{
			layout: 'spa',
			graph: graph
		});
	})
	.catch(next);
}

// GET /fthr/dunes-world
GraphController.prototype.graphLanding = function(req, res, next)
{
	console.log('graphLanding', req.path);
	res.status(500).end();
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

// POST /graph
GraphController.prototype.save = function(req, res, next)
{
	var that = this;
	var basename = fsPath.basename(req.body.path, fsPath.extname(req.body.path));
	var path = '/'+req.user.username+'/'+basename;
	var gridFsPath = '/graph'+path+'.json';

	var tags = that._parseTags(req.body.tags);

	this._service.canWrite(req.user, path)
	.then(function(can)
	{
		if (!can)
		{
			return res.status(403)
				.json({msg: 'Sorry, permission denied'});
		}

		return that._fs.createWriteStream(gridFsPath, 'application/json')
		.then(function(stream)
		{
			var sbuf = new streamBuffers.ReadableStreamBuffer({
				frequency: 10,      // in milliseconds.
				chunkSize: 2048     // in bytes.
			});

			sbuf.put(new Buffer(req.body.graph));

			var url = that._fs.url(gridFsPath);

			stream.on('close', function()
			{
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
				})
				.catch(next);
			})
			.on('error', function(err)
			{
				dfd.reject(err);
			});

			sbuf.on('error', function(err)
			{
				dfd.reject(err);
			});

			sbuf.pipe(stream);
			sbuf.destroySoon();
		});	
	})
	.catch(next);
}

module.exports = GraphController;

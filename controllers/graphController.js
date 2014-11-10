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

// POST /graph
GraphController.prototype.save = function(req, res, next)
{
	var that = this;
	var path = req.body.path;
	if (path.indexOf('/graph/') !== 0)
		path = fsPath.normalize('/graph/' + req.body.path);


	this._service.canWrite(req.user, path)
	.then(function(can)
	{
		if (!can)
		{
			return res.status(403)
				.json({msg: 'Sorry, permission denied'});
		}

		return that._fs.createWriteStream(path, 'application/json')
		.then(function(stream)
		{
			var sbuf = new streamBuffers.ReadableStreamBuffer({
				frequency: 10,      // in milliseconds.
				chunkSize: 2048     // in bytes.
			});

			sbuf.put(new Buffer(req.body.graph));

			var url = that._fs.url(path);

			stream.on('close', function()
			{
				var model =
				{
					path: path,
					url: url
				}

				return that._service.save(model, req.user)
				.then(function(asset)
				{
					res.json(asset);
				});
			});

			sbuf.pipe(stream);
			sbuf.destroySoon();
		});	
	})
	.catch(next);
}

module.exports = GraphController;

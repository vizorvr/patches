var Graph = require('../models/graph');
var AssetController = require('./assetController');

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

	this._service.canWrite(req.user, req.body.path)
	.then(function(can)
	{
		if (!can)
		{
			return res.status(403)
				.json({msg: 'Sorry, permission denied'});
		}

		return that._fs.createWriteStream(req.body.path)
		.then(function(stream)
		{
			var url = that._fs.url(req.body.path);
			var graph = new Buffer(req.body.graph);
			stream.write(graph);

			var model =
			{
				path: req.body.path,
				url: url
			}

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

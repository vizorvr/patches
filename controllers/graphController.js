var Graph = require('../models/graph');
var AssetController = require('./assetController');

function GraphController(graphService)
{
	var args = Array.prototype.slice.apply(arguments);
	args.unshift(Graph);
	AssetController.apply(this, args);
};

GraphController.prototype = Object.create(AssetController.prototype);

// GET /:model
GraphController.prototype.index = function(req, res, next)
{
	this._service.list()
	.then(function(list)
	{
		res.json(list.map(function(item)
		{
			var json = item.toJSON();
			delete json.graph; // don't send graph in list
			return json;
		}));
	})
	.catch(next);
};


module.exports = GraphController;

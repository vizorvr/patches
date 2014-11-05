var Graph = require('../models/graph');
var AssetController = require('./assetController');

function GraphController(graphService, fs)
{
	var args = Array.prototype.slice.apply(arguments);
	args.unshift(Graph);
	AssetController.apply(this, args);
};

GraphController.prototype = Object.create(AssetController.prototype);

module.exports = GraphController;

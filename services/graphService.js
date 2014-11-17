var when = require('when');
var util = require('util');
var AssetService = require('./assetService');
var GraphOptimizer = require('../lib/graphOptimizer');

function GraphService(assetModel, gfs) {
	AssetService.call(this);
	this._model = assetModel;
	this._fs = gfs;
};
util.inherits(GraphService, AssetService);

GraphService.prototype.findByPath = function(path)
{
	var parts = path.split('/');
	return this.findOne({ owner: parts[1], name: parts[2] });
};

GraphService.prototype.save = function(data, user)
{
	var that = this;
	var gridFsPath = '/graph'+data.path+'.json';
	var optimisedGfsPath = '/graph'+data.path+'-min.json';

	return AssetService.prototype.save.apply(this, arguments)
	.then(function(asset)
	{
		// make an optimized copy
		return that._fs.readString(gridFsPath)
		.then(function(source)
		{
			var optimized = new GraphOptimizer()
				.graph(JSON.parse(source))
				.optimize();

			return that._fs.writeString(optimisedGfsPath, 
				JSON.stringify(optimized));
		})
		.then(function()
		{
			return asset;
		});
	});
};

module.exports = GraphService;


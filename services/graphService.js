var when = require('when');
var util = require('util');
var AssetService = require('./assetService')

function GraphService(assetModel) {
	AssetService.call(this);
	this._model = assetModel;
};
util.inherits(GraphService, AssetService);

GraphService.prototype.findByPath = function(path)
{
	var parts = path.split('/');
	return this.findOne({ owner: parts[1], name: parts[2] });
};

module.exports = GraphService;


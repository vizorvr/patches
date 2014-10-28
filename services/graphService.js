var AssetService = require('./assetService');

function GraphService(graphModel)
{
	AssetService.apply(this, arguments);
};

GraphService.prototype = Object.create(AssetService.prototype);

module.exports = GraphService;


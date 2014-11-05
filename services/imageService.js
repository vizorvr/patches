var AssetService = require('./assetService');

function ImageService(imageModel)
{
	AssetService.apply(this, arguments);
};

ImageService.prototype = Object.create(AssetService.prototype);

module.exports = ImageService;


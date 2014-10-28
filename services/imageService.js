var AssetService = require('./assetService');

function ImageService(imageModel)
{
	AssetService.apply(this, arguments);
};

ImageService.prototype = Object.create(ImageService.prototype);

module.exports = ImageService;


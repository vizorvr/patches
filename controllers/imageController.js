var Image = require('../models/image');
var AssetController = require('./assetController');

function ImageController(assetService, fs)
{
	var args = Array.prototype.slice.apply(arguments);
	args.unshift(Image);
	AssetController.apply(this, args);
};

ImageController.prototype = Object.create(AssetController.prototype);

module.exports = ImageController;

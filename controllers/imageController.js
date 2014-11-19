var Image = require('../models/image');
var AssetController = require('./assetController');
var ImageProcessor = require('../lib/imageProcessor');
var fs = require('fs');
var fsPath = require('path');

function ImageController(imageService, fs)
{
	var args = Array.prototype.slice.apply(arguments);
	args.unshift(Image);
	AssetController.apply(this, args);
};

ImageController.prototype = Object.create(AssetController.prototype);

ImageController.prototype.upload = function(req, res, next)
{
	var that = this;

	var file = req.files.file;
	var folder = '/image';

	new ImageProcessor(this._fs)
		.handleUpload(file, folder)
		.then(function(info)
		{
			fs.unlink(file.path, function() {});

			info.path = info.original.path;
			info.url = info.original.url;

			return that._service.save(info, req.user)
			.then(function(asset)
			{
				res.json(asset);
			});
		})
		.catch(next);
};

module.exports = ImageController;

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
	var dest = fsPath.join(folder, file.name);

	return that._service.canWrite(req.user, dest)
	.then(function(can)
	{
		if (!can)
			return res.status(403)
				.json({msg: 'Sorry, permission denied'});

		new ImageProcessor(that._fs)
		.handleUpload(file, folder)
		.then(function(info)
		{
			fs.unlink(file.path);

			info.path = info.original.path;
			info.url = info.original.url;

			return that._service.save(info, req.user)
			.then(function(asset)
			{
				res.json(asset);
			});
		});
	})
	.catch(function(err)
	{
		return next(err);
	});
};

module.exports = ImageController;

var Image = require('../models/image');
var AssetController = require('./assetController');
var ImageProcessor = require('../lib/imageProcessor');
var fs = require('fs');

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
	var path = '/'+that._modelName+'/'+file.name;

	return that._service.canWrite(req.user, path)
	.then(function(can)
	{
		if (!can)
			return res.status(403)
				.json({msg: 'Sorry, permission denied'});

		new ImageProcessor(this._fs)
		.handleUpload(file)
		.then(function(info)
		{
			fs.unlink(file.path);

			// save the model
			info.name = path;
			console.log('saving image', info)

			return that._service.save(info, req.user)
			.then(function(asset)
			{
			console.log('image saved', asset)
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

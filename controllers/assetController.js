var image = require('../models/image');
var fsPath = require('path');
var checksum = require('checksum');
var assetHelper = require('../models/asset-helper');

function AssetController(modelClass, assetService, fs)
{
	this._model = modelClass;
	this._modelName = this._model.modelName.toString().toLowerCase();
	this._service = assetService;
	this._fs = fs;
};

AssetController.prototype.validate = function(req, res, next)
{
	var asset = new this._model(req.body);

	asset.validate(function(err)
	{
		if (err)
			return res.status(400).json(err.errors);

		next();
	});
} 

// GET /:model
AssetController.prototype.index = function(req, res, next)
{
	this._service.list()
	.then(function(list)
	{
		res.json(list);
	})
	.catch(next);
};

AssetController.prototype._parseTags = function(tags)
{
	if (!tags || !tags.length)
		return [];

	if (!Array.isArray(tags))
		tags = tags.split(' ');

	return tags.map(function(tag)
	{
		if (tag[0] !== '#')
			return '#' + tag;

		return tag;
	})
	.filter(function(tag)
	{
		return tag.length > 0;
	});

}

AssetController.prototype._makePath = function(path)
{
	return '/' + this._modelName
		+ '/' + assetHelper.slugify(fsPath.basename(path, fsPath.extname(path)))
		+ fsPath.extname(path);
}

// GET /:model/tag/tag
AssetController.prototype.findByTag = function(req, res, next)
{
	var tag = req.params.tag;
	if (!tag)
		return res.status(400).json({msg: 'No tag'});

	this._service.find(
	{
		tags: '#' + tag.replace(/[^a-zA-Z0-9]/g, '')
	})
	.then(function(list)
	{
		console.log('list');
		res.json(list);
	})
	.catch(next);
};

// GET /:model/:slug
AssetController.prototype.load = function(req, res, next)
{
	this._service.findByPath(req.params.path)
	.then(function(item)
	{
		res.json(item);
	})
	.catch(next);
};

// POST /:model
AssetController.prototype.save = function(req, res, next)
{
	var that = this;

	this._service.canWrite(req.user, req.body.path)
	.then(function(can)
	{
		if (!can)
			return res.status(403)
				.json({msg: 'Sorry, permission denied'});

		return that._service.save(req.body, req.user)
		.then(function(asset)
		{
			asset.tags = that._parseTags(req.body.tags);
			res.json(asset);
		});
	});
}

AssetController.prototype.checksumUpload = function(req, res, next)
{
	checksum.file(req.files.file.path, function(err, sum)
	{
		if (err)
			return next(err);

		req.files.file.sha1 = sum;

		next();
	});
}

AssetController.prototype.canWriteUpload = function(req, res, next)
{
	var that = this;

	if (!req.files)
		return next(new Error('No files uploaded'));

	var file = req.files.file;
	var dest = this._makePath(file.path)

	that._service.canWrite(req.user, dest)
	.then(function(can)
	{
		if (!can)
			return res.status(403)
				.json({msg: 'Sorry, permission denied'});

		next();
	});
} 

AssetController.prototype.upload = function(req, res, next)
{
	var that = this;

	var file = req.files.file;
	var path = this._makePath(file.path)
	var gridFsPath = '/'+that._modelName+'/'+file.sha1+fsPath.extname(file.path);

	return that._service.canWrite(req.user, path)
	.then(function(can)
	{
		if (!can)
			return res.status(403)
				.json({msg: 'Sorry, permission denied'});

		// move the uploaded file into GridFS / local FS
		return that._fs.move(file.path, gridFsPath)
		.then(function(url)
		{
			return that._service.findByPath(path)
			.then(function(model)
			{
				if (!model)
					model = { path: path };

				model.url = url;

				// save/update the model
				return that._service.save(model, req.user)
				.then(function(asset)
				{
					res.json(asset);
				});
			});
		});
	})
	.catch(function(err)
	{
		return next(err);
	});
};

module.exports = AssetController;

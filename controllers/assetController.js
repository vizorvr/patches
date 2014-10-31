var image = require('../models/image');

function AssetController(assetClass, assetService, fs)
{
	this._assetClass = assetClass;
	this._modelName = this._assetClass.modelName.toString().toLowerCase();
	this._service = assetService;
	this._fs = fs;
};

AssetController.prototype.validate = function(req, res, next)
{
	var asset = new this._assetClass(req.body);

	if (!asset.slug)
		asset.slug = asset.slugify(asset.name);

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
		res.json(list.map(function(item)
		{
			return item.toJSON();
		}));
	})
	.catch(next);
};

// GET /:model/:slug
AssetController.prototype.load = function(req, res, next)
{
	this._service.findBySlug(req.params.slug)
	.then(function(item)
	{
		res.json(item.toJSON());
	})
	.catch(next);
};

// POST /:model
AssetController.prototype.save = function(req, res, next)
{
	var that = this;

	this._service.canWrite(req.user, req.body.name)
	.then(function(can)
	{
		if (!can)
			return res.status(403)
				.json({msg: 'Sorry, permission denied'});

		return that._service.save(req.body, req.user)
		.then(function(asset)
		{
			res.json(asset);
		});
	});
}

AssetController.prototype.upload = function(req, res, next)
{
	var that = this;

	var file = req.files.file;
	var path = '/'+that._modelName+'/'+file.name;

	// if the user can write it
	return that._service.canWrite(req.user, path)
	.then(function(can)
	{
		if (!can)
			return res.status(403)
				.json({msg: 'Sorry, permission denied'});

		// move the uploaded file into GridFS / local FS
		return that._fs.move(file.path, path)
		.then(function(url)
		{
console.log('moved', model)
			// save the model
			var model = { name: file.name, url: url };
			return that._service.save(model, req.user)
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

module.exports = AssetController;

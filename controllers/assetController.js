var image = require('../models/image');

function AssetController(assetClass, service)
{
	this._assetClass = assetClass;
	this._service = service;
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
			return res.status(403).json({msg: 'Sorry, permission denied'});

		return that._service.save(req.body, req.user);
	})
	.then(function(asset)
	{
		res.json(asset);
	});
};

module.exports = AssetController;

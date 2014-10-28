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
			return item.defaultView();
		}));
	})
	.catch(next);
};

// GET /graph/:slug
GraphController.prototype.load = function(req, res, next)
{
	this._graphService.findBySlug(req.params.slug)
		.then(function(item)
		{
			res.json(item);
		})
		.catch(next);
};

// POST /graph
GraphController.prototype.save = function(req, res, next)
{
	var that = this;

	this._graphService.canWrite(req.user, req.body.name)
	.then(function(can)
	{
		if (!can)
		{
			return res.status(403).json(
			{
				msg: 'A graph by someone else with that name already exists'
			});
		}

		return that._graphService
			.save(req.body, req.user)
			.then(function(graph)
			{
				res.json({ slug: graph.slug });
			});
	})
	.catch(function(err) { next(err); });
};

module.exports = GraphController;

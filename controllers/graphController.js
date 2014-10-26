var Graph = require('../models/graph');
var User = require('../models/user');
var async = require('async');

function GraphController(graphService)
{
	this._graphService = graphService;
};

GraphController.prototype.validate = function(req, res, next)
{
	var graph = new Graph(req.body);

	graph.validate(function(err)
	{
		if (err)
			return res.status(400).json(err.errors);

		next();
	});
} 

// GET /graph
GraphController.prototype.index = function(req, res, next)
{
	this._graphService.list()
	.then(function(list)
	{
		res.json(list.map(function(item)
		{
			return {
				slug: item.slug,
				name: item.name,
				updated: item.updated,
				creator: item._creator.username
			};
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
			})
	})
	.catch(function(err) { next(err); });
};

module.exports = GraphController;

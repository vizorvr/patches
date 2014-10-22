var Graph = require('../models/graph');
var User = require('../models/user');
var async = require('async');

exports.validate = function(req, res, next)
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
exports.index = function(req, res, next)
{
	Graph
	.find()
	.populate('_creator')
	.exec(function(err, list)
	{
		if (err)
			return next(err);

		res.json(list.map(function(item)
		{
			return {
				slug: item.slug,
				name: item.name,
				updated: item.updated,
				creator: item._creator.username
			};
		}));
	});
};

// POST /graph
exports.save = function(req, res, next)
{
	Graph
	.findOne({ name: req.body.name })
	.exec(function(err, graph)
	{
		if (err)
			return next(err);

		if (graph && graph._creator.toString() !== req.user.id.toString())
		{
			return res.status(403).json(
			{
				msg: 'A graph by someone else with that name already exists'
			});
		}

		if (!graph) {
			graph = new Graph({ name: req.body.name });
		}

		graph._creator = req.user.id;
		graph.graph = req.body.graph;
		graph.save(function(err)
		{
			if (err)
				return next(err);

			res.json(
			{
				slug: graph.slug
			});
		});
	});
};





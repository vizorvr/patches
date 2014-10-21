
var Graph = require('../models/graph');

/**
 * GET /graphs
 */
exports.index = function(req, res)
{
	Graph.find(function(list)
	{
		res.render('graphs/list', list);
	});
};

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

/**
 * POST /graphs/create
 */
exports.postGraph = function(req, res, next)
{
	Graph
	.findOne({ name: req.body.name })
	.exec()
	.then(function(err, eGraph)
	{
		if (err) return next(err);

		if (eGraph && eGraph._creator._id !== req.user._id)
		{
			return res.end(403, { msg:
				'A graph by someone else with that name already exists'
			});
		}

		console.log('save', req.body)

		var graph = new Graph(req.body);
		graph._creator = req.user.id;
		graph.save(function(err)
		{
			console.log('after save', graph);
			if (err) return next(err);

			console.log('responding')
			res.json(
			{
				slug: graph.slug
			});
		});
	});
};





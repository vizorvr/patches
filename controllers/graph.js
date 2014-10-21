
var storage = require('../app-globals').Storage;

/**
 * GET /graphs
 */
exports.index = function(req, res)
{
	Graph.find(function(list)
	{
		res.render('graphs/list', list);
	});
}

/**
 * GET /graphs/show/:id
 */
exports.show = function(req, res)
{
	res.render('graphs/show');
}

/**
 * GET /graphs/edit/:id
 */
exports.edit = function(req, res)
{
	res.render('graphs/edit');
}

/**
 * GET /graphs/delete/:id
 */
exports.delete = function(req, res)
{
	res.redirect('graphs/');
}

/**
 * POST /graphs/create
 */
exports.create = function(req, res)
{
	res.redirect('graphs/show', id);
}




var storage =
{
	graphs:
	{
		list: function list(query)
		{
			return ['lista fileistä']
		}
	}
}




var storage =
{
	graphs:
	{
		list: function list(query)
		{
			return ['lista riveistä'];
		}
	}
}


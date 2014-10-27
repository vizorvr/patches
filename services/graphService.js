var when = require('when');
var Graph;

function GraphService(graphModel) {
	Graph = graphModel;
};

GraphService.prototype.list = function()
{
	var dfd = when.defer();
	Graph
		.find()
		.populate('_creator')
		.exec(function(err, list)
	{
		if (err)
			return dfd.reject(err);
		
		dfd.resolve(list);
	});

	return dfd.promise;
};

GraphService.prototype.canWrite = function(user, name)
{
	return this.findByName(name).then(function(graph)
	{
		return !graph ||
			graph._creator.toString() === user.id.toString();
	});
}

GraphService.prototype.findOne = function(q)
{
	var dfd = when.defer();
	Graph
		.findOne(q)
		.exec(function(err, item)
	{
		if (err)
			return dfd.reject(err);
		
		dfd.resolve(item);
	});

	return dfd.promise;
};

GraphService.prototype.findByName = function(name)
{
	return this.findOne({name: name});
};

GraphService.prototype.findBySlug = function(slug)
{
	return this.findOne({slug: slug});
};

GraphService.prototype.save = function(data, user)
{
	return this.findByName(data.name)
	.then(function(graph)
	{
		if (!graph)
			graph = new Graph(data);

		graph._creator = user.id;
		graph.graph = data.graph;

		var dfd = when.defer();

		graph.save(function(err)
		{
			if (err)
				return dfd.reject(err);

			dfd.resolve(graph);
		});

		return dfd.promise;
	});
};

module.exports = GraphService;


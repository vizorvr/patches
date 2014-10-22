var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var graphSchema = new mongoose.Schema(
{
	_creator:
	{
		type: Schema.Types.ObjectId, ref: 'User'
	},
	name:
	{
		type: String,
		unique: true,
		required: true,
		match: [
			/[a-zA-Z0-9\ \:\-\_]+/,
			'Sorry, please use another name'
		]
	},
	slug: { type: String, index: true, unique: true },
	updated: { type: Date, default: Date.now },
	graph: { type: Schema.Types.Mixed, required: true }
});

graphSchema.pre('save', function(next)
{
	var graph = this;

	graph.slug = graph.name.toLowerCase()
		.replace(/[^\w-]+/g,'')
		.replace(/ +/g, '-');

	graph.updated = Date.now()

	next();
})

module.exports = mongoose.model('Graphs', graphSchema);

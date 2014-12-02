var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');
var _ = require('lodash');
var settings = require('../config/settings');

var alphanumeric = [
	/[a-z0-9\-\_]/,
	'Must be alphanumeric'
];

var graphSchema = new mongoose.Schema(
{
	_creator: { type: Schema.Types.ObjectId, ref: 'User' },
	owner: { type: String, required: true, match: alphanumeric },
	name: { type: String, required: true, match: alphanumeric },
	url: { type: String, required: true },
	tags:
	[{
		type: String,
		match: alphanumeric,
		index: true
	}],
	updatedAt: { type: Date, default: Date.now },
	createdAt: { type: Date, default: Date.now }
},
{
	toObject: { virtuals: true },
	toJSON: { virtuals: true }
});

graphSchema.index({ owner: 1, name: 1, unique: true }); // schema level

graphSchema.virtual('path').get(function()
{
	return '/'+this.owner+'/'+this.name;
});

graphSchema.virtual('path').set(function(path)
{
	var paths = path.split('/');
	this.owner = paths[1];
	this.name = assetHelper.slugify(paths[2]);
});

graphSchema.statics.slugify = assetHelper.slugify;

graphSchema.pre('save', function(next)
{
	var graph = this;
	graph.name = assetHelper.slugify(graph.name);
	next();
});

module.exports = mongoose.model('Graph', graphSchema);

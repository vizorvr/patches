var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');
var _ = require('lodash');


var alphanumeric = [
	/[\w0-9\-\_\/]/,
	'Path must be alphanumeric'
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
		match:
		[
			/[a-z0-9\-\_]/,
			'Tags must be alphanumeric'
		],
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
	this.name = paths[2];
});

module.exports = mongoose.model('Graph', graphSchema);

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');

var fs = require('fs')
var packageJson = JSON.parse(fs.readFileSync(__dirname+'/../package.json'))
var currentPlayerVersion = packageJson.version.split('.').slice(0,2).join('.')

var alphanumeric = [
	/[a-z0-9\-\_]/,
	'Must be alphanumeric'
];

var statSpec = {
	size: { type: Number, required: true }, 
	numAssets: { type: Number, required: true }
};

var graphSchema = new mongoose.Schema({
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
	previewUrlSmall: { type: String },
	previewUrlLarge: { type: String },
	hasAudio: { type: Boolean, default: false },
	version: { type: String, default: currentPlayerVersion },
	stat: statSpec,
	updatedAt: { type: Date, default: Date.now },
	createdAt: { type: Date, default: Date.now }
},
{
	toObject: { virtuals: true },
	toJSON: { virtuals: true }
});

graphSchema.index({ owner: 1, name: 1, unique: true }); // schema level

graphSchema.virtual('path').get(function() {
	return '/'+this.owner+'/'+this.name;
});

graphSchema.virtual('path').set(function(path) {
	var paths = path.split('/');
	this.owner = paths[1];
	this.name = assetHelper.slugify(paths[2]);
});

graphSchema.statics.slugify = assetHelper.slugify;

graphSchema.pre('save', function(next) {
	var graph = this;
	graph.name = assetHelper.slugify(graph.name);
	next();
});

module.exports = mongoose.model('Graph', graphSchema);

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var assetHelper = require('./asset-helper')

var fs = require('fs')
var packageJson = JSON.parse(fs.readFileSync(__dirname+'/../package.json'))
var currentPlayerVersion = packageJson.version.split('.').slice(0,2).join('.')

var when = require('when')

var alphanumeric = [
	/[a-z0-9\-\_]/,
	'Must be alphanumeric'
]

var statSpec = {
	size: { type: Number, required: true }, 
	numAssets: { type: Number, required: true }
}

var graphSchema = new mongoose.Schema({
	_creator: { type: Schema.Types.ObjectId, ref: 'User' },
	owner: { type: String, required: true, match: alphanumeric },
	name: { type: String, required: true, match: alphanumeric },
	url: { type: String, required: true },
	
	tags: [{
		type: String,
		match: alphanumeric,
		index: true
	}],

	previewUrlSmall: { type: String },
	previewUrlLarge: { type: String },

	deleted: { type: Boolean, default: false },
	editable: { type: Boolean, default: true },
	private: { type: Boolean, default: false },

	views: { type: Number, default: 0 },
	rank: { type: Number, default: 0 },

	hasAudio: { type: Boolean, default: false },

	version: { type: String, default: currentPlayerVersion },

	stat: statSpec,

	updatedAt: { type: Date, default: Date.now },
	createdAt: { type: Date, default: Date.now }
}, {
	toObject: { virtuals: true },
	toJSON: { virtuals: true }
})

// unique index on owner+name
graphSchema.index({ owner: 1, name: 1, unique: true })

// index on private + deleted
graphSchema.index({ private: 1, deleted: 1 })

// index rank+private+deleted for discovery
graphSchema.index({ rank: 1, private: 1, deleted: 1 })

// index owner+private+deleted for public userpage
graphSchema.index({ owner: 1, private: 1, deleted: 1 })

// index owner+deleted for own userpage
graphSchema.index({ owner: 1, deleted: 1 })

// used for sorting
graphSchema.virtual('updatedTS').get(function() {
	return this.updatedAt ? this.updatedAt.getTime() : null
})
// added for consistency
graphSchema.virtual('createdTS').get(function() {
	return this.createdAt ? this.createdAt.getTime() : null
})

graphSchema.virtual('path').get(function() {
	return '/'+this.owner+'/'+this.name
})

graphSchema.virtual('path').set(function(path) {
	var paths = path.split('/')
	this.owner = paths[1]
	this.name = assetHelper.slugify(paths[2])
})

graphSchema.statics.slugify = assetHelper.slugify

graphSchema.methods.increaseViewCount = function() {
	var dfd = when.defer()

	this.update({ $inc: { views: 1 } }, { w: 1 }, function(err) {
		if (err)
			return dfd.reject(err)

		dfd.resolve() 
	})
	
	return dfd.promise
}

graphSchema.pre('save', function(next) {
	var graph = this
	graph.name = assetHelper.slugify(graph.name)
	next()
})

module.exports = mongoose.model('Graph', graphSchema)

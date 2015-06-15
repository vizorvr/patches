var mongoose = require('mongoose')
var Schema = mongoose.Schema
var assetHelper = require('./asset-helper')
var when = require('when')

var alphanumeric = [
	/[a-z0-9\-\_]/,
	'Must be alphanumeric'
]


var editLogSchema = new mongoose.Schema({
	// creatorUid: { type: String, required: true }
	name: { type: String, required: true, match: alphanumeric },
	log: { type: Schema.Types.Mixed },
	createdAt: { type: Date, default: Date.now }
}, {
	toObject: { virtuals: true },
	toJSON: { virtuals: true }
})


editLogSchema.index({ name: 1 })


editLogSchema.statics.slugify = assetHelper.slugify

editLogSchema.methods.promiseSave = function() {
	var that = this
	var dfd = when.defer()
	this.save(function(err) {
		if (err)
			return dfd.reject(err)

		dfd.resolve(that.log)
	})

	return dfd.promise
}

editLogSchema.statics.map = function(name, f) {
	var dfd = when.defer()
	var stream = EditLog
		.find({ name: name })
		.sort('_id')
		.stream()

	stream.on('data', f)

	stream.on('error', function(err) {
		if (err) {
			console.error(err)
			return dfd.reject(err)
		}

		stream.close()
	})

	stream.on('close', function() {
		dfd.resolve()
	})

	return dfd.promise
}


editLogSchema.pre('save', function(next) {
	var elog = this
	elog.name = assetHelper.slugify(elog.name)
	next()
})

var EditLog = module.exports = mongoose.model('EditLog', editLogSchema)

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var when = require('when')

var serialSchema = new mongoose.Schema({
  _id: { type: String },
  counter: { type: Number, default: Date.now() }
})

serialSchema.statics.next = function(name) {
	var dfd = when.defer()

	this.findOneAndUpdate(
		{ _id: name },
		{ $inc: { counter: 1 } },
		{ upsert: true, new: true },
		function(err, result) {
			if (err) {
				return dfd.reject(err)
			}

			return dfd.resolve(result.counter)
		})

	return dfd.promise
}

var Serial = mongoose.model('Serial', serialSchema)

module.exports = Serial

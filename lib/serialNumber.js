var when = require('when')

/**
 * uses MongoDB to get a serial number
 **/

function SerialNumber(mongo) {
	this.mongo = mongo
}

SerialNumber.prototype.init = function() {
	var that = this

	this.mongo.collection('counters', function(err, coll) {
		that._coll = coll
	})
}

SerialNumber.prototype.next = function(key) {
	var dfd = when.defer()

	this._coll.findAndModify(
		{ _id: key },
		[[ '_id', 1 ]],
		{ $inc: { seq: 1 } },
		{
			new: true,
			upsert: true
		},
	function(err, doc) {
		if (err)
			return dfd.reject(err)

		dfd.resolve(doc.seq)
	})

	return dfd.promise
}

SerialNumber.prototype.get = function(key) {
	var dfd = when.defer()

	this._coll.findOne({ _id: key }, function(err, doc) {
		if (err)
			return dfd.reject(err)

		dfd.resolve(doc.seq)
	})

	return dfd.promise
}

SerialNumber.prototype.__reset = function(key) {
	var dfd = when.defer()

	this._coll.findAndModify(
		{ _id: key },
		[[ '_id', 1 ]],
		{ $set: { seq: 0 } },
		{
			new: true,
			upsert: true
		},
	function(err, doc) {
		if (err)
			return dfd.reject(err)

		dfd.resolve(doc.seq)
	})

	return dfd.promise
}

module.exports = SerialNumber

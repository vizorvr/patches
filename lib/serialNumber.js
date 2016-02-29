var when = require('when')

/**
 * uses Redis to get a serial number
 **/

function SerialNumber(redisClient) {
	this.redisClient = redisClient
}

SerialNumber.prototype.init = function() {
}

SerialNumber.prototype.next = function(key) {
	var dfd = when.defer()

	this.redisClient.incr(key, function(err, value) {
		if (err)
			return dfd.reject(err)

		dfd.resolve(value)
	})

	return dfd.promise
}

SerialNumber.prototype.get = function(key) {
	var dfd = when.defer()

	this.redisClient.get(key, function(err, value) {
		if (err)
			return dfd.reject(err)

		dfd.resolve(value)
	})

	return dfd.promise
}

SerialNumber.prototype.set = function(key, value) {
	var dfd = when.defer()

	this.redisClient.set(key, value, function(err, value) {
		if (err)
			return dfd.reject(err)

		dfd.resolve(value)
	})

	return dfd.promise
}

SerialNumber.prototype.__reset = function(key) {
	var dfd = when.defer()
	var that = this

	this.redisClient.set(key, 0, function(err) {
		if (err)
			return dfd.reject(err)

		dfd.resolve(that.get(key))
	})


	return dfd.promise
}

module.exports = SerialNumber

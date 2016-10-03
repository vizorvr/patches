var secrets = require('../../../config/secrets')
var mongoose = require('mongoose')
var when = require('when')
mongoose.Promise = global.Promise

var User = require('../../../models/user')
var Graph = require('../../../models/graph')

// find the earliest graph for users that don't have a createdAt date
exports.execute = function() {
	var dfd = when.defer()

	function done(err) {
		mongoose.disconnect()

		if (err) {
			console.error('ERROR: ', err.stack)
			return dfd.reject(err)
		}

		dfd.resolve()
	}

	mongoose.connect(secrets.db)

	mongoose.connection.on('connected', () => {
		return User.find({ createdAt: null })
		.then(users => {
			return when.map(users, user => {
				return Graph.find({ owner: user.username })
				.sort('createdAt')
				.then(graphs => {
					if (!graphs.length) {
						user.createdAt = Date.now()
					} else {
						user.createdAt = graphs[0].createdAt
					}

					console.log('Updated user', user.username)

					return User.update({ _id: user._id }, { $set: { createdAt: user.createdAt }})
				})
			})
		})
		.then(() => { done() })
		.catch(done)
	})

	mongoose.connection.on('error', done)

	return dfd.promise
}

if (require.main === module)
	exports.execute()

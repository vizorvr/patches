var when = require('when')
var r = require('rethinkdb')
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var User = require('./user')

var alphanumeric = [
	/[a-z0-9\-\_]/,
	'Must be alphanumeric'
];

var editLogSchema = new mongoose.Schema({
	_creator: { type: Schema.Types.ObjectId, ref: 'User' },
	owner: { type: String, required: true, match: alphanumeric },
	name: { type: String, required: true, unique: true, match: alphanumeric },
	readableName: { type: String, required: true, match: alphanumeric },
	participants: [ { type: String, index: true } ],
	updatedAt: { type: Date, default: Date.now },
	createdAt: { type: Date, default: Date.now }
},
{
	toObject: { virtuals: true },
	toJSON: { virtuals: true }
})

// compound index on owner + readableName
editLogSchema.index({
	owner: 1,
	readableName: 1,
	unique: true
})

editLogSchema.methods.addParticipant = function(userId) {
	var dfd = when.defer()

	this.participants.addToSet(userId)
	this.save(function(err) {
		if (err)
			return dfd.reject(err)

		dfd.resolve()
	})

	return dfd.promise
}

// statics

editLogSchema.statics.joinOrCreate = function(channelName, readableName, userId) {
	var dfd = when.defer()
	
	this.findOne({ name: channelName })
	.exec(function(err, exLog) {
		if (err)
			return dfd.reject(err)

		if (exLog)
			return dfd.resolve(exLog.addParticipant(userId))

		User.findById(userId).exec(function(err, user) {
			if (err)
				return dfd.reject(err)

			new EditLog({
				name: channelName,
				readableName: readableName,
				owner: userId,
				participants: [ userId ]
			}).save(function(err, editLog) {
				if (err) {
					if (err.code === 11000) {
						// duplicate, try to join again
						return dfd.resolve(EditLog.joinOrCreate(channelName, readableName, userId))
					}

					return dfd.reject(err)
				}

				dfd.resolve(editLog)				
			})
		})
	})

	return dfd.promise
}


/**
 * check whether RethinkDB has any edits for this
 * @returns Promise<boolean>
 */
editLogSchema.statics.hasEditsByName = function(rethinkConn, name) {
	var dfd = when.defer()

	r.table('editlog')
	.filter(r.row('name').eq(name))
	.limit(1)
	.orderBy('id')
	.run(rethinkConn, function(err, cursor) {
		if (err)
			return dfd.reject(err)

		console.log('EditLog.hasEditsByName', name, cursor.length)
		dfd.resolve(cursor.length > 0)
	})

	return dfd.promise
}

var EditLog = mongoose.model('EditLog', editLogSchema)
module.exports = EditLog

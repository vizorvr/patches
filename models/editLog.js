var when = require('when')
var r = require('rethinkdb')
var mongoose = require('mongoose')
var Schema = mongoose.Schema

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

module.exports = mongoose.model('EditLog', editLogSchema);

var when = require('when')
var r = require('rethinkdb')

function EditLog() {}

EditLog.hasEditsByName = function(conn, name) {
	var dfd = when.defer()

	r.table('editlog')
	.filter(r.row('name').eq(name))
	.limit(1)
	.orderBy('id')
	.run(conn, function(err, cursor) {
		if (err)
			return dfd.reject(err)

		console.log('EditLog.hasEditsByName', name, cursor.length)
		dfd.resolve(cursor.length > 0)
	})

	return dfd.promise
}

module.exports = EditLog

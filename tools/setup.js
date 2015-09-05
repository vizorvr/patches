var r = require('rethinkdb')
var _rethinkConnection

function setupRethinkDatabase() {
	var dbName = process.env.RETHINKDB_NAME || 'vizor'
	var tableName = 'editlog'

	return r.connect({
		host: process.env.RETHINKDB_HOST || 'localhost',
		port: 28015,
		db: dbName
	})
	.then(function(conn) {
		_rethinkConnection = conn

		return r.dbList().run(conn)
		.then(function(dbList) {
			if (dbList.indexOf(dbName) === -1)
				return r.dbCreate(dbName).run(conn)
		})
		.then(function() {
			return r.db(dbName).tableList().run(conn)
			.then(function(list) {
				if (list.indexOf(tableName) === -1) {
					return r.db(dbName)
						.tableCreate('editlog')
						.run(conn)
				}
			})
		}).then(function() {
			_rethinkConnection.close()
		})
	})
	.error(function errHandler(err) {
		throw err;
	})
}

exports.setupRethinkDatabase = setupRethinkDatabase

if (require.main === module) {
	var bundleEditorScripts = require('./editorBundler').bundleEditorScripts

	setupRethinkDatabase()
	.then(bundleEditorScripts)
}


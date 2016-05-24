const db = require('./0.11.0-userstats')

db.execute()
.catch(function(err) {
	console.error('ERROR', err)
	process.exit(1)
})
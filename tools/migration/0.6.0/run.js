const db = require('./0.6.0-slotname-db')

db.execute()
.catch(function(err) {
	console.error('ERROR', err)
	process.exit(1)
})
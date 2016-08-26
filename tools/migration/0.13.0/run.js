const p1 = require('./0.13.0-rename-collection')
const p2 = require('./0.13.0-import-patches')
const p3 = require('./0.13.0-sanitise-patches')

console.log('-- begin')
p1.execute()
.catch(function(err) {
	console.error('ERROR', err)
	process.exit(1)
})
.then(function() {
	console.log('-- p1 complete')
	return p2.execute()
})
.then(function() {
	console.log('-- p2 complete')
	return p3.execute()
})
.then(function() {
	console.log('-- done')
})
.catch(function(err) {
	console.error('ERROR', err)
	process.exit(1)
})

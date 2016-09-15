var fs = require('fs')
var fsPath = require('path')
var execSync = require('child_process').execSync

if (process.argv.length < 3) {
	console.error('usage: test-runner <folder>')
	process.exit(1)
}

var testFolder = process.argv[2]

var items = fs.readdirSync(testFolder)
items.map(function(item) {
	if (item[0] === '.')
		return;

	try {
		var tp = fsPath.join(testFolder, item)
		console.log('----- Running ', tp)
		execSync('./node_modules/mocha/bin/mocha ' +
			'--timeout 8000 --full-trace --verbose --colors ' +
			tp, {
				stdio: [ 0, 1, 2 ]
		})
	} catch(e) {
		// the error was already logged, just exit
		process.exit(1)
	}
})




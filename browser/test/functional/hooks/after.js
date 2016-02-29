var fs = require('fs')

var AfterHook = module.exports = function(done) {
	var that = this

	if (!this.hadFailures || !process.env.CI_BUILD_NUMBER)
	    return this.browser.end().then(done.bind({}, null))

	console.log('Saving log')

	this.browser.log('browser')
	.then(function(log) {
		var logStr  = 'Codeship: '+process.env.CI_BUILD_URL+'\n'
			logStr += 'Artefacts: http://fail.vizor.lol/' +
				process.env.CI_BUILD_NUMBER + '/\n\n'
			logStr += 'Browser log:\n\n'

		log.value.map(function(item) {
			var itemStr = item.timestamp + ' ' + item.level + ' ' + item.message
			logStr += itemStr + '\n'
		})

		console.error(logStr)

		console.log('Writing log')

		fs.writeFileSync('./' + process.env.CI_BUILD_NUMBER + '/log.txt', logStr)

		console.log('Log saved')
	
	    that.browser
	    	.end()
	    	.then(done.bind({}, null))
	})
};

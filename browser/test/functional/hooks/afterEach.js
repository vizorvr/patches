var fs = require('fs')

var AfterEachHook = module.exports = function (done) {
	if (this.state !== 'failed')
		return done()

	if (!process.env.CI_BUILD_NUMBER)
		return done()

	var that = this

	var shotName = './' + process.env.CI_BUILD_NUMBER + '.png'

	this.browser.log('browser')
	.then(function(log) {
		var logStr  = 'Failed: '+that.scenario + ' / ' + that.step + '\n\n'
			logStr += 'Screenshot: http://fail.vizor.lol/'+
				process.env.CI_BUILD_NUMBER + '.png'+'\n\n'
			logStr += 'Browser log:\n\n'

		log.value.map(function(item) {
			var itemStr = item.timestamp + ' ' + item.level + ' ' + item.message
			console.error(itemStr)
			logStr += itemStr + '\n'
		})

		fs.writeFileSync('./' + process.env.CI_BUILD_NUMBER + '.txt', logStr)

		that.browser
		.saveScreenshot(shotName)
		.then(function() {
			done()
		});
	})

};

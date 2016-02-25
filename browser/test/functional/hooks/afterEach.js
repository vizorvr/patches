var fs = require('fs')

var AfterEachHook = module.exports = function (done) {
	if (this.state === 'passed') {
		return done()
	}

	if (!process.env.CI_BUILD_NUMBER) {
		return done()
	}

	var that = this

	if (!fs.existsSync(process.env.CI_BUILD_NUMBER))
		fs.mkdirSync(process.env.CI_BUILD_NUMBER)

	var shotName = './' +
		process.env.CI_BUILD_NUMBER + '/' +
		(this.scenario + '_' + this.step)
		.replace(/\W+/g, ' ')
		.trim()
		.replace(/\W+/g, '-') +
		'.png'

	this.browser
	.saveScreenshot(shotName)
	.then(function() {
		console.log('Screenshot taken as', shotName)
		done()
	});
};

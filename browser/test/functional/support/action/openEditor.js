var config = require('../../config').config

module.exports = function (done) {
    var url = this.baseUrl + '/edit'
    var timeout = config.options.waitforTimeout

	var browser = this.browser
	var ff = function() {
		browser
			.timeoutsAsyncScript(timeout)
			.executeAsync(function(cb) {
				var interval = setInterval(function() {
					if (E2.app.channel.connected) {
						clearInterval(interval)
						cb()
					}
				}, 300)
			})
			.call(done)
	}

    browser
	    .setViewportSize({ width: 1024, height: 768 })
        .url(url)
		.waitForExist('body.bEditor')
		.waitForExist('div#canvases')
		.waitForVisible('div.welcome', 5000)
		.then(function(){
			browser
				.click('div.welcome button.close')
				.waitForExist('div.welcome', null, true)
				.deleteCookie('vizor100')
				.then(ff)
		}, ff)
}


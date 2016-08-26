var config = require('../../config').config

module.exports = function (done) {
    var timeout = config.options.waitforTimeout
    var url = this.baseUrl + '/edit'

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


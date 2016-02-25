var config = require('../../config').config

module.exports = function (done) {
    var url = this.baseUrl + '/edit'
    var timeout = config.options.waitforTimeout

    this.browser
	    .setViewportSize({ width: 1024, height: 768 })
        .url(url)
        .waitForVisible('div.welcome')
        .click('button.close')
        .waitForExist('div.welcome', null, true)
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


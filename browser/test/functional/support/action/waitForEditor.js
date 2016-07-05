var config = require('../../config').config

module.exports = function (done) {
    var timeout = config.options.waitforTimeout
    var url = this.baseUrl + '/edit'

    this.browser
        .url(url)
        .waitForVisible('div.welcome')
        .click('button.close')
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


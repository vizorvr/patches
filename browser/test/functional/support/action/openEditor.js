module.exports = function (done) {
    var url = this.baseUrl + '/edit'
    var timeout = 10000

    this.browser
	    .setViewportSize({ width: 1024, height: 768 })
        .url(url)
        .waitForVisible('div.welcome', timeout)
        .click('button.close')
        .waitForExist('div.welcome', timeout, true)
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


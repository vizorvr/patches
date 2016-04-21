var config = require('../../config').config

module.exports = function (done) {
    var timeout = config.options.waitforTimeout

    this.browser
	    .timeoutsAsyncScript(timeout)
        .executeAsync(function(cb) {
            E2.core.once('player:playing', function() {
            	setTimeout(cb, 0)
            })
        })
        .call(done)
}


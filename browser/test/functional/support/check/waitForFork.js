var config = require('../../config').config

module.exports = function (done) {
    var timeout = config.options.waitforTimeout

    this.browser
        .execute(function(cb) {
            E2.core.once('forked', cb)
        })
        .call(done)
}


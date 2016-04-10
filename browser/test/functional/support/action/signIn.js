var config = require('../../config').config

var rand = process.hrtime().join('')

module.exports = function (done) {
    var url = this.baseUrl + '/signup'
    var timeout = config.options.waitforTimeout

    this.browser
        .url(url)
        .setValue('#name_id', 'Test User'+rand)
        .setValue('#username_id', 'test'+rand)
        .setValue('#email_id', 'test'+rand+'@vizor.io')
        .setValue('#password_id', 't3st3r!R0b0t')
        .click('button.sign-btn')
        .call(done)
}


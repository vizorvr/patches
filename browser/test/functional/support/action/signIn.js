var config = require('../../config').config


module.exports = function (done) {
    var url = this.baseUrl + '/signup'
    var timeout = config.options.waitforTimeout

    var rand = process.hrtime().join('')

    this.browser
        .url(url)
        .setValue('#name_id', 'Test User'+rand)
        .setValue('#username_id', 'test'+rand)
        .setValue('#email_id', 'test'+rand+'@vizor.io')
        .setValue('#password_id', 't3st3r!R0b0t')
        .click('button.sign-btn')
        .call(done)
}


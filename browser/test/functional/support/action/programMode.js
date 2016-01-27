module.exports = function (done) {
    var timeout = 10000

    this.browser
        .click('button#programModeBtn')
        .waitForVisible('.graph-node', timeout)
        .call(done)
}


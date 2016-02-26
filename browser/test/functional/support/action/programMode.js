module.exports = function (done) {
    this.browser
        .click('button#programModeBtn')
        .waitForVisible('.graph-node')
        .call(done)
}


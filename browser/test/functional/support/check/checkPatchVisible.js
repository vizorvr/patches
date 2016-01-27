/**
 * check if patch is visible on canvas
 */

module.exports = function (patchName, done) {
    this.browser
        .isVisible('span.p_title='+patchName)
        .then(function(visible) {
            visible.should.equal(true, 'expected patch "' + patchName + '" to be visible')
        })
        .call(done)
};

/**
 * check number of nodes
 */

module.exports = function(number, done) {
    this.browser
        .elements('span.p_title')
        .then(function(elements) {
            elements.value.length
            .should.equal(parseInt(number, 10))
        })
        .call(done)
};

var assert = require('assert')
var fs = require('fs')
var when = require('when')
var GraphAnalyser = require('../../common/graphAnalyser').GraphAnalyser

var graphJson = fs.readFileSync(__dirname+'/../fixtures/loaders.json')

describe('Graph analysis', function() {
	var ga

	beforeEach(function() {
		ga = new GraphAnalyser({
			stat: function(url) {
				var dfd = when.defer()
				dfd.resolve({ length: 2 })
				return dfd.promise
			}
		})
	})

	it('parses the size', function(done) {
		ga.analyseJson(graphJson)
		.then(function(stat) {
			assert.equal(stat.size, 8)
			done()
		})
	})

	it('parses the number of assets', function(done) {
		ga.analyseJson(graphJson)
		.then(function(stat) {
			assert.equal(stat.numAssets, 4)
			done()
		})
	})

	it('returns 0 size if assets not found', function(done) {
		ga = new GraphAnalyser({
			stat: function() {
				return when.resolve()
			}
		})

		ga.analyseJson(graphJson)
		.then(function(stat) {
			assert.equal(stat.numAssets, 4)
			assert.equal(stat.size, 0)
			done()
		})
	})

})

var assert = require('assert');

var helpers = require('./helpers')
var reset = require('./helpers').reset
var fs = require('fs')
var when = require('when')

describe('Initialisation together with if statements', function() {
	var core, app

	beforeEach(function() {
		reset()
	})

	it('inits the correct number', function() {
		var source = JSON.parse(fs.readFileSync(__dirname +
			'/../fixtures/init-revolver.json'))

		E2.core.deserialiseObject(source)

		var ag = E2.core.active_graph
		var navigation = E2.core.active_graph.nodes[3]
		var floatDisplay = ag.nodes[10]

		ag.update({abs_t: 0, delta_t: 1/60})
		assert.equal(floatDisplay.plugin.value, 1)

		ag.update({abs_t: 1/60, delta_t: 1/60})
		assert.equal(floatDisplay.plugin.value, 1)
	})

})
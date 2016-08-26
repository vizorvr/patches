var assert = require('assert');
var fs = require('fs')

var reset = require('./helpers').reset;

describe('Color converters', function() {
	var source

	beforeEach(function() {
		reset()

		app = E2.app

		source = JSON.parse(fs.readFileSync(__dirname+'/../fixtures/357-color-convert-plugins.json')).root
	})

	it('displays the right color', function() {
		app.setupStoreListeners()

		app.pasteObject(source)

		E2.core.active_graph.update()
		
		assert.ok(E2.core.active_graph.nodes[10].plugin.color.r > 0.9999)
		assert.equal(E2.core.active_graph.nodes[10].plugin.color.g, 1)
		assert.equal(E2.core.active_graph.nodes[10].plugin.color.b, 0)
		
		assert.equal(E2.core.active_graph.nodes[11].plugin.color.r, 1)
		assert.equal(E2.core.active_graph.nodes[11].plugin.color.g, 1)
		assert.equal(E2.core.active_graph.nodes[11].plugin.color.b, 0)

	})

})

	

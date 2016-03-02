var assert = require('assert');

var helpers = require('./helpers')
var reset = helpers.reset
var connect = helpers.connect
var disconnect = helpers.disconnect

var reset = require('./helpers').reset;

describe('Changing Slot Values', function() {
	var graph, orNode, floatDisplay

	beforeEach(function() {
		reset()

		graph = E2.core.active_graph
		orNode = E2.app.instantiatePlugin('or_modulator')
		floatDisplay = E2.app.instantiatePlugin('bool_display')

		connect(graph, orNode, 0, floatDisplay, 0, false)

		E2.app.graphApi
			.changeSlotValue(graph, orNode, 'a', true)
	})

	it('sets values on dispatch', function() {
		assert.equal(true, orNode.plugin.conds[0])
		graph.update()
		assert.equal(true, floatDisplay.plugin.inputValues['bool'])
	})

	it('can undo to previous value', function() {
		E2.app.graphApi
			.changeSlotValue(graph, orNode, 'a', false)

		assert.equal(false, orNode.plugin.conds[0])

		E2.app.undoManager.undo()

		assert.equal(true, orNode.plugin.conds[0])
		graph.update()
		assert.equal(true, floatDisplay.plugin.inputValues['bool'])
	})

	it('can serialize slot values', function() {
		var ser = E2.core.serialiseToObject()
		assert.equal(ser.root.nodes[0].uiSlotValues.a, true)
	})

	it('uses slot default after override ends', function() {
		var slot = orNode.findInputSlotByName('a')
		slot.def = 3
		E2.app.graphApi
			.changeSlotValue(graph, orNode, 'a', 3)
		assert.equal(orNode.getInputSlotValue('a'), 3)
	})

	it('can deserialize slot values', function() {
		var ser = E2.core.serialise()
		graph = E2.core.deserialise(ser)

		assert.equal(graph.nodes[0]
			.getInputSlotValue('a'), true)
	})

})



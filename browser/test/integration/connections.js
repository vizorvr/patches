var assert = require('assert')

var helpers = require('./helpers')

var EditConnection = require('../../scripts/editConnection')

describe('Connections', function() {
	var core, app, graphApi, ec

	beforeEach(function() {
		core = helpers.reset()
		
		global.window = { location: { pathname: 'test/test' } }

		require('../../scripts/util')

		app = E2.app
		app.player = { core: core }
		app.channel = { broadcast: function(){}}
		app.updateCanvas = function(){}
		global.E2.app = app
		graphApi = E2.app.graphApi
	})

	it('can undo and redo connection replacement', function() {
		app.setupStoreListeners()
		var graph = E2.core.active_graph

		var toggle1 = E2.app.instantiatePlugin('toggle_button', [0,0])
		var toggle2 = E2.app.instantiatePlugin('toggle_button', [0,0])
		var toggle3 = E2.app.instantiatePlugin('toggle_button', [0,0])

		var boolDisplay = E2.app.instantiatePlugin('bool_display', [0,0])
		var ds = boolDisplay.plugin.input_slots[0]

		// connect first toggle
		var conn1 = new Connection(toggle1, null, toggle1.plugin.output_slots[0], null)
		ec = new EditConnection(graphApi, conn1)
		ec.hoverSlot(boolDisplay, ds)
		ec.commit()

		assert.equal(boolDisplay.inputs[0].src_slot, toggle1.plugin.output_slots[0])
		assert.equal(1, toggle1.outputs.length)
		assert.equal(true, toggle1.plugin.output_slots[0].is_connected)

		// replace with second toggle
		var conn2 = new Connection(toggle2, null, toggle2.plugin.output_slots[0], null)
		ec = new EditConnection(graphApi, conn2)
		ec.hoverSlot(boolDisplay, ds)
		ec.commit()

		assert.deepEqual(boolDisplay.inputs[0].src_slot, toggle2.plugin.output_slots[0])
		assert.equal(0, toggle1.outputs.length)
		assert.equal(1, toggle2.outputs.length)
		assert.equal(0, toggle3.outputs.length)
		assert.equal(false, toggle1.plugin.output_slots[0].is_connected)
		assert.equal(true, toggle2.plugin.output_slots[0].is_connected)
		assert.ok(!toggle3.plugin.output_slots[0].is_connected)

		// replace with third toggle
		var conn3 = new Connection(toggle3, null, toggle3.plugin.output_slots[0], null)
		ec = new EditConnection(graphApi, conn3)
		ec.hoverSlot(boolDisplay, ds)
		ec.commit()

		assert.deepEqual(boolDisplay.inputs[0].src_slot, toggle3.plugin.output_slots[0])
		assert.equal(0, toggle1.outputs.length)
		assert.equal(0, toggle2.outputs.length)
		assert.equal(1, toggle3.outputs.length)
		assert.equal(false, toggle1.plugin.output_slots[0].is_connected)
		assert.equal(false, toggle2.plugin.output_slots[0].is_connected)
		assert.equal(true, toggle3.plugin.output_slots[0].is_connected)

		// undo, reverting to 2nd connection
		E2.app.undoManager.undo() 
		assert.equal(boolDisplay.inputs[0].src_slot, toggle2.plugin.output_slots[0])
		assert.equal(0, toggle1.outputs.length)
		assert.equal(1, toggle2.outputs.length)
		assert.equal(0, toggle3.outputs.length)
		assert.equal(false, toggle1.plugin.output_slots[0].is_connected)
		assert.equal(true, toggle2.plugin.output_slots[0].is_connected)
		assert.equal(false, toggle3.plugin.output_slots[0].is_connected)

		// undo, reverting to 1st connection
		E2.app.undoManager.undo() 
		assert.equal(boolDisplay.inputs[0].src_slot, toggle1.plugin.output_slots[0])
		assert.equal(1, toggle1.outputs.length)
		assert.equal(0, toggle2.outputs.length)
		assert.equal(0, toggle3.outputs.length)
		assert.equal(true, toggle1.plugin.output_slots[0].is_connected)
		assert.equal(false, toggle2.plugin.output_slots[0].is_connected)
		assert.equal(false, toggle3.plugin.output_slots[0].is_connected)

		// undo, reverting to none
		E2.app.undoManager.undo() 
		assert.equal(0, toggle1.outputs.length)
		assert.equal(0, toggle2.outputs.length)
		assert.equal(0, toggle3.outputs.length)
		assert.equal(false, toggle1.plugin.output_slots[0].is_connected)
		assert.equal(false, toggle2.plugin.output_slots[0].is_connected)
		assert.equal(false, toggle3.plugin.output_slots[0].is_connected)

		// redo, reverting to first
		E2.app.undoManager.redo() 
		assert.equal(1, toggle1.outputs.length)
		assert.equal(0, toggle2.outputs.length)
		assert.equal(0, toggle3.outputs.length)
		assert.equal(true, toggle1.plugin.output_slots[0].is_connected)
		assert.equal(false, toggle2.plugin.output_slots[0].is_connected)
		assert.equal(false, toggle3.plugin.output_slots[0].is_connected)

		// redo, reverting to 2nd
		E2.app.undoManager.redo() 
		assert.equal(0, toggle1.outputs.length)
		assert.equal(1, toggle2.outputs.length)
		assert.equal(0, toggle3.outputs.length)
		assert.equal(false, toggle1.plugin.output_slots[0].is_connected)
		assert.equal(true, toggle2.plugin.output_slots[0].is_connected)
		assert.equal(false, toggle3.plugin.output_slots[0].is_connected)

		// redo, reverting to 3rd
		E2.app.undoManager.redo() 
		assert.equal(0, toggle1.outputs.length)
		assert.equal(0, toggle2.outputs.length)
		assert.equal(1, toggle3.outputs.length)
		assert.equal(false, toggle1.plugin.output_slots[0].is_connected)
		assert.equal(false, toggle2.plugin.output_slots[0].is_connected)
		assert.equal(true, toggle3.plugin.output_slots[0].is_connected)

	})

})


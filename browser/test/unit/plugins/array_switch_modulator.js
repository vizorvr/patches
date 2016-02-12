var assert = require('assert')

var reset = require('./helpers').reset
var loadPlugin = require('./helpers').loadPlugin

describe('array_switch_modulator', function() {
	var plugin, core

	beforeEach(function() {
		core = reset()
		loadPlugin('array_switch_modulator')
		var node = new Node()
		plugin = new E2.plugins.array_switch_modulator(core, node)
		plugin.state_changed()

		node.add_slot(E2.slot_type.input, {
			type: E2.slot_type.input,
			name: '0',
			dt: plugin.lsg.dt
		})

		node.add_slot(E2.slot_type.input, {
			type: E2.slot_type.input,
			name: '1',
			dt: plugin.lsg.dt
		})

		node.add_slot(E2.slot_type.input, {
			type: E2.slot_type.input,
			name: '1',
			dt: plugin.lsg.dt
		})
	})

	it('uses the correct input count', function() {
		plugin.update_state({abs_t:0, delta_t:(1/60)})
		var output = plugin.update_output({index: 1})
		assert.equal(output, 3)

		plugin.update_input({ index: 0, uid: 1 }, 10)
		plugin.update_input({ index: 1, uid: 2 }, 20)

		plugin.update_state({abs_t:0, delta_t:(1/60)})
		output = plugin.update_output({index: 1})
		assert.equal(output, 3)
	})

	it('defaults to input 0', function() {
		plugin.update_input({index: 0, uid: 1}, 100)
		plugin.update_input({index: 1, uid: 2}, 200)

		plugin.update_state({abs_t:0, delta_t:(1/60)})

		var output = plugin.update_output({index: 0})
		assert.equal(output, 100)
	})

	it('gives a null default value', function() {
		plugin.update_state({abs_t:0, delta_t:(1/60)})

		var output = plugin.update_output({index: 0})
		assert.equal(output, null)

		plugin.update_input({index: 0, uid: 1}, 100)
		plugin.update_state({abs_t:0, delta_t:(1/60)})
		var output = plugin.update_output({index: 0})
		assert.equal(output, 100)

		plugin.update_input({index: 0, uid: 1}, null)
		plugin.update_state({abs_t:0, delta_t:(1/60)})
		var output = plugin.update_output({index: 0})
		assert.equal(output, null)
	})

	it('selects the correct input', function() {
		plugin.update_input({index: 0, uid: 1}, 10)
		plugin.update_input({index: 1, uid: 2}, 20)
		plugin.update_input({index: 2, uid: 3}, 30)

		// select input 1
		plugin.update_input({index: 0}, 1)

		plugin.update_state({abs_t:0, delta_t:(1/60)})

		var output = plugin.update_output({index: 0})
		assert.equal(output, 20)

		// select input 0
		plugin.update_input({index: 0}, 0)

		plugin.update_state({abs_t:0, delta_t:(1/60)})

		output = plugin.update_output({index: 0})
		assert.equal(output, 10)

		// select input 2
		plugin.update_input({index: 0}, 2)

		plugin.update_state({abs_t:0, delta_t:(1/60)})

		output = plugin.update_output({index: 0})
		assert.equal(output, 30)

	})

	it ('updates inputs', function() {
		var output

		// set initial values
		plugin.update_input({index: 0, uid: 1}, 10)
		plugin.update_input({index: 1, uid: 2}, 20)
		plugin.update_input({index: 2, uid: 3}, 30)

		// check all inputs for their initial values
		plugin.update_input({index: 0}, 0)
		plugin.update_state({abs_t:0, delta_t:(1/60)})
		output = plugin.update_output({index: 0})
		assert.equal(output, 10)

		plugin.update_input({index: 0}, 1)
		plugin.update_state({abs_t:0, delta_t:(1/60)})
		output = plugin.update_output({index: 0})
		assert.equal(output, 20)

		plugin.update_input({index: 0}, 2)
		plugin.update_state({abs_t:0, delta_t:(1/60)})
		output = plugin.update_output({index: 0})
		assert.equal(output, 30)

		// reset all inputs
		plugin.update_input({index: 0, uid: 1}, 40)
		plugin.update_input({index: 1, uid: 2}, 50)
		plugin.update_input({index: 2, uid: 3}, 60)

		// check all inputs for their new values
		plugin.update_input({index: 0}, 0)
		plugin.update_state({abs_t:0, delta_t:(1/60)})
		output = plugin.update_output({index: 0})
		assert.equal(output, 40)

		plugin.update_input({index: 0}, 1)
		plugin.update_state({abs_t:0, delta_t:(1/60)})
		output = plugin.update_output({index: 0})
		assert.equal(output, 50)

		plugin.update_input({index: 0}, 2)
		plugin.update_state({abs_t:0, delta_t:(1/60)})
		output = plugin.update_output({index: 0})
		assert.equal(output, 60)
	})
})

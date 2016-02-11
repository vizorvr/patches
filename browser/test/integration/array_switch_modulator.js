var assert = require('assert');

var reset = require('./helpers').reset;

describe('array_switch_modulator', function() {
	beforeEach(function() {
		reset()
	})

	function connect(graph, a, aidx, b, bidx, dyn) {
		var ss = a.plugin.output_slots[aidx]
		var ds = dyn ? b.getDynamicInputSlots()[bidx] : b.plugin.input_slots[bidx]

		assert.ok(ss)
		assert.ok(ds)

		var conn = new Connection(a, b, ss, ds)
		conn.uid = E2.uid()

		conn.patch_up()
		E2.app.graphApi.connect(graph, conn)
		E2.app.onLocalConnectionChanged(conn)
		conn.signal_change(true)

		return conn
	}

	function disconnect(graph, conn) {
		E2.app.graphApi.disconnect(graph, conn)
		E2.app.onLocalConnectionChanged(conn)
		conn.signal_change(false)
	}

	it('clears arrayness', function() {
		var graph = E2.core.active_graph

		var floatNode1 = E2.app.instantiatePlugin('const_float_generator')
		var floatNode2 = E2.app.instantiatePlugin('const_float_generator')
		var inputsToArrayNode = E2.app.instantiatePlugin('inputs_to_array')
		var arraySwitchModulator = E2.app.instantiatePlugin('array_switch_modulator')

		var pullerNode = E2.app.instantiatePlugin('float_display')

		connect(graph, floatNode1, 0, inputsToArrayNode, 0, true)
		connect(graph, floatNode2, 0, inputsToArrayNode, 1, true)

		E2.app.graphApi.addSlot(graph, arraySwitchModulator, {
			type: E2.slot_type.input,
			name: '0',
			dt: arraySwitchModulator.plugin.lsg.dt
		})

		// connect array to revolver
		var arrayConn = connect(graph, inputsToArrayNode, 0, arraySwitchModulator, 0, true)

		floatNode1.plugin.state.val = 10
		floatNode2.plugin.state.val = 20

		connect(graph, arraySwitchModulator, 1, pullerNode, 0)

		arraySwitchModulator.plugin.lsg.infer_dt()

		// pull array, expect [10, 20]
		arraySwitchModulator.plugin.update_input({index: 0}, 0)
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), [10, 20])

		// disconnect
		disconnect(graph, arrayConn)

		// check with no inputs
		arraySwitchModulator.plugin.update_input({index: 0}, 0)
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 0)

		// connect a single float
		connect(graph, floatNode1, 0, arraySwitchModulator, 0, true)
		arraySwitchModulator.plugin.lsg.infer_dt()

		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 10)
	})

	it('propagates arrayness', function() {
		var graph = E2.core.active_graph

		var inputSelectorNumberNode = E2.app.instantiatePlugin('const_float_generator')

		var floatNode1 = E2.app.instantiatePlugin('const_float_generator')
		var floatNode2 = E2.app.instantiatePlugin('const_float_generator')
		var floatNode3 = E2.app.instantiatePlugin('const_float_generator')
		var inputsToArrayNode1 = E2.app.instantiatePlugin('inputs_to_array')
		var inputsToArrayNode2 = E2.app.instantiatePlugin('inputs_to_array')
		var arraySwitchModulator = E2.app.instantiatePlugin('array_switch_modulator')

		var pullerNode = E2.app.instantiatePlugin('float_display')

		connect(graph, floatNode1, 0, inputsToArrayNode1, 0, true)
		connect(graph, floatNode2, 0, inputsToArrayNode1, 1, true)

		connect(graph, floatNode2, 0, inputsToArrayNode2, 0, true)
		connect(graph, floatNode3, 0, inputsToArrayNode2, 1, true)

		E2.app.graphApi.addSlot(graph, arraySwitchModulator, {
			type: E2.slot_type.input,
			name: '0',
			dt: arraySwitchModulator.plugin.lsg.dt
		})

		E2.app.graphApi.addSlot(graph, arraySwitchModulator, {
			type: E2.slot_type.input,
			name: '1',
			dt: arraySwitchModulator.plugin.lsg.dt
		})

		// connect input selector to revolver
		connect(graph, inputSelectorNumberNode, 0, arraySwitchModulator, 0, false)

		// connect arrays to revolver
		var arrayConn1 = connect(graph, inputsToArrayNode1, 0, arraySwitchModulator, 0, true)
		var arrayConn2 = connect(graph, inputsToArrayNode2, 0, arraySwitchModulator, 1, true)

		floatNode1.plugin.state.val = 10
		floatNode2.plugin.state.val = 20
		floatNode3.plugin.state.val = 30

		connect(graph, arraySwitchModulator, 1, pullerNode, 0)

		arraySwitchModulator.plugin.lsg.infer_dt()

		// length
		assert.equal(arraySwitchModulator.plugin.update_output({index: 1}), 2)

		// select the second array, expect [20, 30]
		inputSelectorNumberNode.plugin.state.val = 1
		inputSelectorNumberNode.plugin.updated = true
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), [20, 30])

		// select the first array, expect [10, 20]
		inputSelectorNumberNode.plugin.state.val = 0
		inputSelectorNumberNode.plugin.updated = true
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), [10, 20])

		// disconnect
		E2.app.graphApi.disconnect(graph, arrayConn1)
		E2.app.onLocalConnectionChanged(arrayConn1)

		E2.app.graphApi.disconnect(graph, arrayConn2)
		E2.app.onLocalConnectionChanged(arrayConn1)

		// connect non-arrays to revolver
		var floatConn1 = connect(graph, floatNode1, 0, arraySwitchModulator, 0, true)
		var floatConn2 = connect(graph, floatNode2, 0, arraySwitchModulator, 1, true)

		arraySwitchModulator.plugin.lsg.infer_dt()

		floatNode1.plugin.state.val = 40
		floatNode2.plugin.state.val = 50
		floatNode1.plugin.updated = true
		floatNode2.plugin.updated = true

		graph.update()

		// length
		assert.equal(arraySwitchModulator.plugin.update_output({index: 1}), 2)

		// select first input, expect 40
		inputSelectorNumberNode.plugin.state.val = 0
		inputSelectorNumberNode.plugin.updated = true
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 40)

		// select second input, expect 50
		inputSelectorNumberNode.plugin.state.val = 1
		inputSelectorNumberNode.plugin.updated = true
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 50)

		floatNode1.plugin.state.val = 60

		// select first input again, expect 60
		inputSelectorNumberNode.plugin.state.val = 0
		inputSelectorNumberNode.plugin.updated = true
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 60)
	})

	it('updates inactive input chains', function() {
		var graph = E2.core.active_graph

		var inputSelectorNumberNode = E2.app.instantiatePlugin('const_float_generator')

		var floatNode1 = E2.app.instantiatePlugin('const_float_generator')
		var floatNode2 = E2.app.instantiatePlugin('const_float_generator')

		var addNode = E2.app.instantiatePlugin('add_modulator')

		var arraySwitchModulator = E2.app.instantiatePlugin('array_switch_modulator')

		var pullerNode = E2.app.instantiatePlugin('float_display')

		E2.app.graphApi.addSlot(graph, arraySwitchModulator, {
			type: E2.slot_type.input,
			name: '0',
			dt: arraySwitchModulator.plugin.lsg.dt
		})

		E2.app.graphApi.addSlot(graph, arraySwitchModulator, {
			type: E2.slot_type.input,
			name: '1',
			dt: arraySwitchModulator.plugin.lsg.dt
		})

		// connect input selector to revolver
		connect(graph, inputSelectorNumberNode, 0, arraySwitchModulator, 0, false)

		// connect float1 to add node
		connect(graph, floatNode1, 0, addNode, 0, false)

		// connect arrays to revolver
		var arrayConn1 = connect(graph, addNode, 0, arraySwitchModulator, 0, true)
		var arrayConn2 = connect(graph, floatNode2, 0, arraySwitchModulator, 1, true)

		floatNode1.plugin.state.val = 10
		floatNode2.plugin.state.val = 20

		connect(graph, arraySwitchModulator, 1, pullerNode, 0)

		arraySwitchModulator.plugin.lsg.infer_dt()

		// select the first array, expect 10
		inputSelectorNumberNode.plugin.state.val = 0
		inputSelectorNumberNode.plugin.updated = true
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 10)

		// select the second array, expect 20
		inputSelectorNumberNode.plugin.state.val = 1
		inputSelectorNumberNode.plugin.updated = true
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 20)

		floatNode1.plugin.state.val = 30

		// select first input, expect 30
		inputSelectorNumberNode.plugin.state.val = 0
		inputSelectorNumberNode.plugin.updated = true
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 30)

		floatNode2.plugin.state.val = 40

		// select second input, expect 40
		inputSelectorNumberNode.plugin.state.val = 1
		inputSelectorNumberNode.plugin.updated = true
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 40)

		floatNode1.plugin.state.val = 50

		// select first input, expect 50
		inputSelectorNumberNode.plugin.state.val = 0
		inputSelectorNumberNode.plugin.updated = true
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 50)
	})

})



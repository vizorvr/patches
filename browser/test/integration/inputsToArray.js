var assert = require('assert');

var reset = require('./helpers').reset;

describe('inputs_to_array', function() {
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

	it('outputs an array', function() {
		var graph = E2.core.active_graph

		var floatNode1 = E2.app.instantiatePlugin('const_float_generator')
		var floatNode2 = E2.app.instantiatePlugin('const_float_generator')

		var inputsToArrayNode = E2.app.instantiatePlugin('inputs_to_array')

		var pullerNode = E2.app.instantiatePlugin('float_display')

		connect(graph, floatNode1, 0, inputsToArrayNode, 0, true)
		connect(graph, floatNode2, 0, inputsToArrayNode, 1, true)

		connect(graph, inputsToArrayNode, 0, pullerNode, 0, false)

		floatNode1.plugin.state.val = 10
		floatNode2.plugin.state.val = 20

		graph.update()

		assert.ok(inputsToArrayNode.plugin.output_slots[0].array === true)
	})

})

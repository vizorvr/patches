var assert = require('assert');

var reset = require('./helpers').reset;

describe('Runtime events', function() {
	beforeEach(function() {
		reset()
		app = E2.app
	})

	it('trigger for one frame only when system emits', function() {
		var graph = E2.core.active_graph

		E2.app.instantiatePlugin('const_text_generator')
		E2.app.instantiatePlugin('runtime_event_read')
		E2.app.instantiatePlugin('float_display')

		var textNode = graph.nodes[0]
		var readNode = graph.nodes[1]
		var floatNode = graph.nodes[2]

		// connect read output to float
		var c = Connection.hydrate(graph, {
			src_nuid: readNode.uid,
			dst_nuid: floatNode.uid,
			src_slot: 1,
			dst_slot: 0,
		})

		readNode.plugin.connection_changed(true,
			c, readNode.plugin.output_slots[0])

		// connect text.output to readNode.eventName
		Connection.hydrate(graph, {
			src_nuid: textNode.uid,
			dst_nuid: readNode.uid,
			src_slot: 0,
			dst_slot: 0,
		})

		// set text value
		textNode.plugin.state.text = 'testEventName'

		graph.update()

		E2.core.runtimeEvents.emit('testEventName', 32)

		graph.update()
	
		assert.equal(32, floatNode.plugin.value)
	
		graph.update()

		assert.equal(0, floatNode.plugin.value)
	})

	it('trigger for one frame only when writer emits', function() {
		var graph = E2.core.active_graph

		E2.app.instantiatePlugin('runtime_event_write')

		E2.app.instantiatePlugin('const_text_generator')
		E2.app.instantiatePlugin('runtime_event_read')
		E2.app.instantiatePlugin('float_display')

		var emitNode = graph.nodes[0]
		var textNode = graph.nodes[1]
		var readNode = graph.nodes[2]
		var floatNode = graph.nodes[3]

		// connect read output to float
		var c = Connection.hydrate(graph, {
			src_nuid: readNode.uid,
			dst_nuid: floatNode.uid,
			src_slot: 1,
			dst_slot: 0,
		})

		readNode.plugin.connection_changed(true,
			c, readNode.plugin.output_slots[0])

		// connect text.output to emitNode.eventName
		Connection.hydrate(graph, {
			src_nuid: textNode.uid,
			dst_nuid: emitNode.uid,
			src_slot: 0,
			dst_slot: 1,
		})

		// connect text.output to readNode.eventName
		Connection.hydrate(graph, {
			src_nuid: textNode.uid,
			dst_nuid: readNode.uid,
			src_slot: 0,
			dst_slot: 0,
		})

		// set text value
		textNode.plugin.state.text = 'testEventName'

		graph.update()

		var epl = emitNode.plugin
		epl.update_input(epl.input_slots[0], true)
		epl.update_input(epl.input_slots[2], 32.62)

		graph.update()
		
		assert.equal(32.62, floatNode.plugin.value)
	
		graph.update()

		assert.equal(0, floatNode.plugin.value)
	})

	it('trigger for multiple frames when continuous writer emits', function() {
		var graph = E2.core.active_graph

		E2.app.instantiatePlugin('runtime_event_write_continuous')

		E2.app.instantiatePlugin('const_text_generator')
		E2.app.instantiatePlugin('runtime_event_read')
		E2.app.instantiatePlugin('float_display')

		var emitNode = graph.nodes[0]
		var textNode = graph.nodes[1]
		var readNode = graph.nodes[2]
		var floatNode = graph.nodes[3]

		// connect read output to float
		var c = Connection.hydrate(graph, {
			src_nuid: readNode.uid,
			dst_nuid: floatNode.uid,
			src_slot: 1,
			dst_slot: 0,
		})

		readNode.plugin.connection_changed(true,
		c, readNode.plugin.output_slots[0])

		// connect text.output to emitNode.eventName
		Connection.hydrate(graph, {
			src_nuid: textNode.uid,
			dst_nuid: emitNode.uid,
			src_slot: 0,
			dst_slot: 1,
		})

		// connect text.output to readNode.eventName
		Connection.hydrate(graph, {
			src_nuid: textNode.uid,
			dst_nuid: readNode.uid,
			src_slot: 0,
			dst_slot: 0,
		})

		// set text value
		textNode.plugin.state.text = 'testEventName'

		graph.update()

		var epl = emitNode.plugin
		epl.update_input(epl.input_slots[0], true)
		epl.update_input(epl.input_slots[2], 79.21)

		graph.update()

		// two frames with a value
		assert.equal(79.21, floatNode.plugin.value)

		graph.update()

		assert.equal(79.21, floatNode.plugin.value)

		// switch emitter off for two frames
		epl.update_input(epl.input_slots[0], false)

		graph.update()

		assert.equal(0, floatNode.plugin.value)

		graph.update()

		assert.equal(0, floatNode.plugin.value)

		// switch emitter on again for two frames
		epl.update_input(epl.input_slots[0], true)

		graph.update()

		assert.equal(79.21, floatNode.plugin.value)

		graph.update()

		assert.equal(79.21, floatNode.plugin.value)
	})
})

	

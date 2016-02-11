var assert = require('assert');
var fs = require('fs')

var reset = require('./helpers').reset;
describe('Array function', function() {
	beforeEach(function() {
		reset()
		app = E2.app
	})

	it('isn`t run consecutively because always_update is off', function() {
		app.setupStoreListeners()

		var updates = 0

		var graph = E2.core.active_graph

		E2.app.instantiatePlugin('array_function')
		E2.app.instantiatePlugin('data_info_display')

		var afNode = graph.nodes[0]
		var diNode = graph.nodes[1]

		Connection.hydrate(graph, {
			src_nuid: afNode.uid,
			dst_nuid: diNode.uid,
			src_slot: 0,
			dst_slot: 0,
		})
		
		afNode.plugin.update_state = function() {
			updates++
		}

		graph.update()
		graph.update()

		assert.equal(1, updates)
	})

})

	

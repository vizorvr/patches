var assert = require('assert')
var fs = require('fs')
var reset = require('./helpers').reset
var source = fs.readFileSync(__dirname+'/../fixtures/arrayfunction.json')

describe('Array function', function() {
	beforeEach(function() {
		reset()
		app = E2.app
	})

	it('keeps a copy for every iteration', function() {
		app.setupStoreListeners()

		var graph = E2.core.active_graph

		E2.core.deserialiseObject(JSON.parse(source))

		var afn = E2.core.active_graph.nodes[0]
		var afp = afn.plugin

		// clone the graphs x 3
		afp.update_input({ name: 'length' }, 3)

		// run a frame
		afp.update_state({ delta_t: 1 })

		assert.equal(3, afp.graph.copies.length)

		// collect id's for created objects
		var frame1ids = []
		afp.graph.copies.map(function(igraph) {
			frame1ids.push(
				igraph.nodes[2].plugin // text
					.graph.nodes[4].plugin // mesh
						.object3d.uuid
			)
		})

		// run another frame
		afp.update_state({ delta_t: 2 })

		// collect id's for created objects
		var frame2ids = []
		afp.graph.copies.map(function(igraph) {
			frame2ids.push(
				igraph.nodes[2].plugin // text
					.graph.nodes[4].plugin // mesh
						.object3d.uuid
			)
		})

		// make sure they haven't been recreated
		assert.deepEqual(frame1ids, frame2ids)
	})

	it('applies edits to all copies', function() {
		app.setupStoreListeners()

		var graph = E2.core.active_graph

		E2.core.deserialiseObject(JSON.parse(source))

		var afn = E2.core.active_graph.nodes[0]
		var afp = afn.plugin

		// clone the graphs x 3
		afp.update_input({ name: 'length' }, 3)

		var orig = afp.graph

		var changedUpdates = 0

		afp.graph.copies.map(function(copy) {
			copy.once('nodeRemoved', function() { changedUpdates++ })
		})

		E2.app.dispatcher.dispatch({
			actionType: 'uiNodeRemoved',
			graphUid: orig.uid,
			nodeUid: orig.nodes[0].uid
		})

		assert.equal(3, changedUpdates)
	})

})

	

var assert = require('assert');

var helpers = require('./helpers')
var reset = helpers.reset
var fs = require('fs')
var connect = helpers.connect
var disconnect = helpers.disconnect

var reset = require('./helpers').reset;

var variablesJson = fs.readFileSync(__dirname+'/../fixtures/variables.json').toString()

describe('Variables', function() {
	beforeEach(function() {
		reset()
	})

	it('keeps correct track of connections', function() {
		E2.core.deserialise(variablesJson)

		var graph = E2.core.root_graph

		// assert 5 connections
		assert.equal(graph.variables.variables.a.connections, 5)

		// disconnect one
		disconnect(graph, graph.nodes[5].inputs[0])

		assert.equal(graph.variables.variables.a.connections, 4)

		// // delete selection
		E2.app.selectedNodes = [
			graph.nodes[6], // const_float
			graph.nodes[7], // variable_write_conditional
		]
		E2.app.selectedConnections = [
			graph.nodes[7].inputs[0],
		]
		E2.app.onCopy()
		E2.app.onDelete()

		// assert one connection less
		assert.equal(graph.variables.variables.a.connections, 3)

		// paste
		E2.app.pasteFromClipboard()

		assert.equal(graph.variables.variables.a.connections, 4)
	})
})



var assert = require('assert');

var helpers = require('./helpers')

describe('Simple graph shapes', function() {
	var core, app

	beforeEach(function() {
		core = helpers.reset()
		
		global.window = { location: { pathname: 'test/test' } }

		require('../../scripts/util')

		E2.commands.graph = require('../../scripts/commands/graphEditCommands')
		app = E2.app
		app.player = { core: core }
		app.channel = { broadcast: function(){}}
		app.updateCanvas = function(){}
		global.E2.app = app
	})

	it('subgraph with input and output proxy', function() {
		var graphNode = E2.app.instantiatePlugin('graph', [0,0])
		var graph = graphNode.plugin.graph
		E2.core.active_graph = graph

		E2.app.instantiatePlugin('input_proxy', [0,0])
		E2.app.instantiatePlugin('output_proxy', [0,0])
		
		assert.equal(E2.core.graphs.length, 2)
		assert.equal(graph.nodes.length, 2)
		assert.equal(graphNode.plugin.parent_node.dyn_inputs.length, 1)
		assert.equal(graphNode.plugin.parent_node.dyn_outputs.length, 1)
	})

	it('input_proxy connected to float sets type', function() {
		app.setupStoreListeners()
		var graphNode = E2.app.instantiatePlugin('graph', [0,0])
		var graph = graphNode.plugin.graph
		E2.core.active_graph = graph
		var ipx = E2.app.instantiatePlugin('input_proxy', [0,0])
		var floatDisplay = E2.app.instantiatePlugin('float_display', [0,0])
		var ss = ipx.dyn_outputs[0]
		var ds = floatDisplay.plugin.input_slots[0]
		E2.app.graphApi.connect(graph, new Connection(ipx, floatDisplay, ss, ds, 0))
		assert.equal(ss.dt.name, 'Float')
	})

	it('connected input_proxy add redo does not throw', function() {
		app.setupStoreListeners()
		var pg = E2.core.active_graph

		var graphNode = E2.app.instantiatePlugin('graph', [0,0])
		var graph = graphNode.plugin.graph
		E2.core.active_graph = graph

		var ipx = E2.app.instantiatePlugin('input_proxy', [0,0])
		var floatDisplay = E2.app.instantiatePlugin('float_display', [0,0])
		var ss = ipx.dyn_outputs[0]
		var ds = floatDisplay.plugin.input_slots[0]

		var ipxFloatConn = new Connection(ipx, floatDisplay, ss, ds, 0)
		E2.app.graphApi.connect(graph, ipxFloatConn)

		var constFloat = E2.app.instantiatePlugin('const_float_generator', [0,0])
		ss = constFloat.plugin.output_slots[0]
		ds = graphNode.dyn_inputs[0]

		E2.core.active_graph = pg
		E2.app.graphApi.connect(pg, new Connection(constFloat, graphNode, ss, ds, 0))

		E2.app.undoManager.undo() // undo connection
		E2.app.undoManager.undo() // undo constFloat
		E2.app.undoManager.undo() // undo ipx-floatDisplay connection
		E2.app.undoManager.undo() // undo floatDisplay
		E2.app.undoManager.undo() // undo ipx

		E2.app.undoManager.redo() // redo ipx
		E2.app.undoManager.redo() // redo floatDisplay
		E2.app.undoManager.redo() // redo ipx-floatDisplay connection
		E2.app.undoManager.redo() // redo constFloat
		E2.app.undoManager.redo() // redo connection
	})

})


var assert = require('assert');

var reset = require('./plugins/helpers').reset;

global.E2 = {}
var Application = require('../../scripts/application')

global.Node = require('../../scripts/node')
global.EventEmitter = require('../../scripts/event-emitter')
global.EditorChannel = function(){}
global.Graph = require('../../scripts/graph')
global.Flux = require('../../vendor/flux')
global.Plugin = require('../../scripts/plugin');
global.Store = require('../../scripts/store');
global.GraphStore = require('../../scripts/graphStore');

global.NodeUI = function() {
	this.dom = [$()]
	this.dom.position = this.dom[0].position
	this.dom.width = this.dom[0].width
	this.dom.height = this.dom[0].height
	this.dom[0].style = {}
}
global.Registers = function() {
	this.serialise = function(){}
}
global.PresetManager = function() {}
require('../../scripts/commands/graphEditCommands')
global.UndoManager = require('../../scripts/commands/undoManager.js')
global.GraphApi = require('../../scripts/graphApi.js')
global.Connection = require('../../scripts/connection.js').Connection
global.ConnectionUI = require('../../scripts/connection.js').ConnectionUI
global.ConnectionUI.prototype.resolve_slot_divs = function() {
	this.src_slot_div = $()
	this.dst_slot_div = $()
}
global.navigator = { userAgent: 'test' }

describe('Simple graph shapes', function() {
	var core, app

	beforeEach(function() {
		core = reset()
		core.active_graph = new Graph(core, null, {})
		core.graphs = [ core.active_graph ]
		
		E2.commands.graph = require('../../scripts/commands/graphEditCommands')
		app = new Application()
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

})


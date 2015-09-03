var assert = require('assert');

var reset = require('./plugins/helpers').reset;

global.E2 = {}
var Application = require('../../scripts/application')

global.EventEmitter = require('../../scripts/event-emitter')
global.Node = require('../../scripts/node').Node
global.EditorChannel = function(){}
global.Graph = require('../../scripts/graph')
global.Flux = require('../../vendor/flux')
global.Plugin = require('../../scripts/plugin');
global.Store = require('../../scripts/store');
global.GraphStore = require('../../scripts/graphStore');
global.PeopleManager = function() {}
global.PeopleStore = function(){}

global.NodeUI = function() {
	this.dom = [$()]
	this.dom.position = this.dom[0].position
	this.dom.width = this.dom[0].width
	this.dom.height = this.dom[0].height
	this.dom.find = function() { return { remove: function(){} } }
	this.dom[0].style = {}
}
global.NodeUI.create_slot = function(){}
global.Node.prototype.create_ui = function(){
	// this.ui = new global.NodeUI()
	return null
}
global.Node.prototype.destroy_ui = function(){}

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
global.E2.plugins = {}

global.E2.util = {}
global.E2.util.isMobile = function() {return false}

describe('Node inputs', function() {
	var core, app

	var ValidateTestPlugin = function(core) {
		console.log('ctor')
		Plugin.apply(this, arguments)

		this.desc = 'THREE.js Dodecahedron Geometry'

		this.min = 5
		this.max = 10

		this.input_slots = [
		{
			name: 'clamped input',
			dt: core.datatypes.FLOAT,
			def: 0,
			validate: function(v) {return Math.max(this.min, Math.min(v, this.max))}
		}]

		this.output_slots = []
	}

	ValidateTestPlugin.prototype = Object.create(Plugin.prototype)

	ValidateTestPlugin.prototype.update_input = function(slot, data) {
		console.log('update_input')
		assert(data >= this.min)
		assert(data <= this.max)

		Plugin.prototype.update_input.apply(this, arguments)
	}

	beforeEach(function() {
		core = reset()
		core.active_graph = new Graph(core, null, {})
		core.graphs = [ core.active_graph ]
		core.rebuild_structure_tree = function(){}

		global.window = { location: { pathname: 'test/test' } }

		E2.commands.graph = require('../../scripts/commands/graphEditCommands')
		app = new Application()
		app.player = { core: core }
		app.channel = { broadcast: function(){}}
		app.updateCanvas = function(){}

		global.E2.app = app
	})

	it('validate works', function() {
		var ag = E2.core.active_graph

		var validateNode = new Node(ag, undefined, 0, 0)
		validateNode.set_plugin(new ValidateTestPlugin(E2.core, validateNode))
		var constFloat = E2.app.instantiatePlugin('const_float_generator', [0,0])

		var ss = constFloat.plugin.output_slots[0]
		var ds = validateNode.plugin.input_slots[0]

		E2.app.graphApi.connect(ag, new Connection(constFloat, validateNode, ss, ds, 0))
		validateNode.update_recursive()
	})
/*
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
*/
})


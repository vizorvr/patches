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
		Plugin.apply(this, arguments)

		this.desc = 'Plugin for testing input slot validation'

		this.min = 5
		this.max = 10

		that = this
		this.input_slots = [
		{
			name: 'clamped input',
			dt: core.datatypes.FLOAT,
			def: 0,
			validate: function(v) {return Math.max(that.min, Math.min(v, that.max))}
		}]

		this.output_slots = []
	}

	ValidateTestPlugin.prototype = Object.create(Plugin.prototype)

	ValidateTestPlugin.prototype.update_input = function(slot, data) {
		console.log('update_input ' + data)
		assert(data >= this.min)
		assert(data <= this.max)

		Plugin.prototype.update_input.apply(this, arguments)
	}

	var FloatEmitterPlugin = function(core) {
		Plugin.apply(this, arguments)

		this.desc = 'Plugin for testing input slot validation'

		this.input_slots = []

		this.output_slots = [
			{
				name: 'output',
				dt: core.datatypes.FLOAT
			}
		]
	}

	FloatEmitterPlugin.prototype = Object.create(Plugin.prototype)

	FloatEmitterPlugin.prototype.set_value = function(v) {
		this.value = v
		this.updated = 1
	}

	FloatEmitterPlugin.prototype.update_output = function(slot, data) {
		return this.value
	}


	beforeEach(function() {
		core = reset()
		core.active_graph = new Graph(core, null, {})
		core.graphs = [ core.active_graph ]
		core.rebuild_structure_tree = function(){}

		global.window = { location: { pathname: 'test/test' } }

		require('../../scripts/util')

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
		var validatePlugin = new ValidateTestPlugin(E2.core, validateNode)
		validateNode.set_plugin(validatePlugin)
		validatePlugin.reset()

		var constFloat = new Node(ag, undefined, 0, 0)
		var constFloatPlugin = new FloatEmitterPlugin(E2.core, constFloat)
		constFloat.set_plugin(constFloatPlugin)
		constFloatPlugin.reset()

		var ss = constFloat.plugin.output_slots[0]
		var ds = validateNode.plugin.input_slots[0]

		ag.addNode(validateNode)
		ag.addNode(constFloat)

		var conn = new Connection(constFloat, validateNode, ss, ds, 0)
		ag.connect(conn)
		conn.patch_up()

		constFloatPlugin.set_value(0)
		ag.update()

		constFloatPlugin.set_value(5)
		ag.update()

		constFloatPlugin.set_value(10)
		ag.update()

		constFloatPlugin.set_value(15)
		ag.update()
	})

})


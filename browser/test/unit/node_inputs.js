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
global.Store = require('../../scripts/stores/store');
global.GraphStore = require('../../scripts/stores/graphStore');
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

global.Node.prototype.create_ui = function(){
	// this.ui = new global.NodeUI()
	return null
}
global.Node.prototype.destroy_ui = function(){}

global.Registers = function() {
	this.serialise = function(){}
}
global.PatchManager = function() {}
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
		assert(data >= this.min)
		assert(data <= this.max)

		Plugin.prototype.update_input.apply(this, arguments)
	}

	var FloatEmitterPlugin = function(core, node, isArray) {
		Plugin.apply(this, arguments)

		this.desc = 'Test plugin for emitting floats / arrays of floats'

		this.input_slots = []

		this.output_slots = [
			{
				name: 'output',
				dt: core.datatypes.FLOAT
			}
		]

		if (isArray) {
			this.output_slots[0].array = true
		}
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

		global.WebVRConfig = global.WebVRConfig || {}

		global.E2.Variables = function() {
			this.serialise = function(){}
		}

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

	it('validates', function() {
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

	var FloatConsumerPlugin = function(core, node, isArray) {
		Plugin.apply(this, arguments)

		this.desc = 'Test plugin for consuming floats / arrays of floats'

		this.input_slots = [
			{
				name: 'input',
				dt: core.datatypes.FLOAT
			}]

		if (isArray) {
			this.input_slots[0].array = true
		}

		this.output_slots = []
	}

	FloatConsumerPlugin.prototype = Object.create(Plugin.prototype)

	FloatConsumerPlugin.prototype.get_value = function(v) {
		return this.value
	}

	FloatConsumerPlugin.prototype.update_input = function(slot, data) {
		this.value = data
	}

	it('handles array inputs and outputs', function() {
		var ag = E2.core.active_graph

		var floatNode = new Node(ag, undefined, 0, 0)
		var floatPlugin = new FloatEmitterPlugin(E2.core, floatNode)
		floatNode.set_plugin(floatPlugin)
		floatPlugin.reset()

		var floatArrayNode = new Node(ag, undefined, 0, 0)
		var floatArrayPlugin = new FloatEmitterPlugin(E2.core, floatArrayNode, true)
		floatArrayNode.set_plugin(floatArrayPlugin)
		floatArrayPlugin.reset()

		var floatConsumerNode = new Node(ag, undefined, 0, 0)
		var floatConsumerPlugin = new FloatConsumerPlugin(E2.core, floatConsumerNode)
		floatConsumerNode.set_plugin(floatConsumerPlugin)
		floatConsumerPlugin.reset()

		var floatArrayConsumerNode = new Node(ag, undefined, 0, 0)
		var floatArrayConsumerPlugin = new FloatConsumerPlugin(E2.core, floatArrayConsumerNode, true)
		floatArrayConsumerNode.set_plugin(floatArrayConsumerPlugin)
		floatArrayConsumerPlugin.reset()

		ag.addNode(floatNode)
		ag.addNode(floatConsumerNode)
		ag.addNode(floatArrayNode)
		ag.addNode(floatArrayConsumerNode)

		// round 1 - test arrays to arrays and non-arrays to non-arrays

		// connect float -> float
		var ss = floatNode.plugin.output_slots[0]
		var ds = floatConsumerNode.plugin.input_slots[0]

		var ftofconn = new Connection(floatNode, floatConsumerNode, ss, ds, 0)
		ag.connect(ftofconn)
		ftofconn.patch_up()

		// connect float array -> float array
		ss = floatArrayNode.plugin.output_slots[0]
		ds = floatArrayConsumerNode.plugin.input_slots[0]

		var atoaconn = new Connection(floatArrayNode, floatArrayConsumerNode, ss, ds, 0)
		ag.connect(atoaconn)
		atoaconn.patch_up()

		floatPlugin.set_value(128)
		ag.update()
		assert.equal(floatConsumerPlugin.get_value(), 128)

		floatPlugin.set_value(64)
		ag.update()
		assert.equal(floatConsumerPlugin.get_value(), 64)

		floatArrayPlugin.set_value([1, 7, 4096, 12345, 1, 2])
		ag.update()
		assert.deepEqual(floatArrayConsumerPlugin.get_value(), [1, 7, 4096, 12345, 1, 2])

		floatArrayPlugin.set_value([999, 1, 415])
		ag.update()
		assert.deepEqual(floatArrayConsumerPlugin.get_value(), [999, 1, 415])

		ag.disconnect(ftofconn)
		ag.disconnect(atoaconn)

		// round 2 - mix arrays / non-arrays

		// connect float -> array
		ss = floatNode.plugin.output_slots[0]
		ds = floatConsumerNode.plugin.input_slots[0]

		var ftoaconn = new Connection(floatNode, floatArrayConsumerNode, ss, ds, 0)
		ag.connect(ftoaconn)
		ftoaconn.patch_up()

		// connect float array -> float
		ss = floatArrayNode.plugin.output_slots[0]
		ds = floatConsumerNode.plugin.input_slots[0]

		var atofconn = new Connection(floatArrayNode, floatConsumerNode, ss, ds, 0)
		ag.connect(atofconn)
		atofconn.patch_up()

		floatPlugin.set_value(250)
		ag.update()
		assert.deepEqual(floatArrayConsumerPlugin.get_value(), [250])

		floatPlugin.set_value(550)
		ag.update()
		assert.deepEqual(floatArrayConsumerPlugin.get_value(), [550])

		floatArrayPlugin.set_value([10, 20, 30, 40])
		ag.update()
		assert.equal(floatConsumerPlugin.get_value(), 10)

		floatArrayPlugin.set_value([40, 50, 60, 70])
		ag.update()
		assert.equal(floatConsumerPlugin.get_value(), 40)
	})

})


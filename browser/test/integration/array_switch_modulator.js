var assert = require('assert');

var reset = require('../unit/plugins/helpers').reset;
var loadPlugin = require('../unit/plugins/helpers').loadPlugin;

global.E2 = {}
var Application = require('../../scripts/application')

global._ = require('lodash')
global.EventEmitter = require('../../scripts/event-emitter')
global.Node = require('../../scripts/node').Node
global.LinkedSlotGroup = require('../../scripts/node').LinkedSlotGroup
global.AutoSlotGroup = require('../../scripts/autoSlotGroup').AutoSlotGroup
global.Graph = require('../../scripts/graph')
global.Flux = require('../../vendor/flux')
global.Plugin = require('../../scripts/plugin');
global.Store = require('../../scripts/stores/store');
global.GraphStore = require('../../scripts/stores/graphStore');
global.PeopleManager = function() {}
global.PeopleStore = function() {
	this.list = function(){ return [] }
}

global.NodeUI = function() {
	this.dom = [$()]
	this.dom.remove = function(){}
	this.dom.position = this.dom[0].position
	this.dom.width = this.dom[0].width
	this.dom.height = this.dom[0].height
	this.dom[0].style = {}
}

global.PresetManager = function() {}

require('../../scripts/commands/graphEditCommands')

global.TextureCache = function(){}

function Color() {}
Color.prototype.setRGB = function(r, g, b) {
	this.r = r
	this.g = g
	this.b = b
}

global.THREE = {
	Vector3: function(){},
	Matrix4: function(){},
	Color: Color,
	Material: function(){},
	MeshBasicMaterial: function(){},
	PerspectiveCamera: function(){}
}
global.THREE.Matrix4.prototype.identity = function() {}

global.UndoManager = require('../../scripts/commands/undoManager.js')
global.GraphApi = require('../../scripts/graphApi.js')
global.Connection = require('../../scripts/connection.js').Connection
global.ConnectionUI = require('../../scripts/connection.js').ConnectionUI
global.ConnectionUI.prototype.resolve_slot_divs = function() {
	this.src_slot_div = $()
	this.dst_slot_div = $()
}
global.navigator = { userAgent: 'test' }
global.mixpanel = { track: function() {} }

describe('array_switch_modulator', function() {

	global.window = global

	var Core = require('../../scripts/core')

	function PluginManager() {
		EventEmitter.call(this)
		this.keybyid = {}
		var that = this
		process.nextTick(function() {
			that.emit('ready')
		})
	}
	PluginManager.prototype = Object.create(EventEmitter.prototype)
	PluginManager.prototype.create = function(id, node) {
		if (!E2.plugins[id])
			loadPlugin(id)
		console.log('load', id, !!E2.plugins[id])
		var p = new E2.plugins[id](core, node)
		p.id = id
		return p
	}

	global.PluginManager = PluginManager

	// global.Node.prototype.initialise = function(){}

	function TreeNode() {}
	TreeNode.prototype.add_child = function() { return new TreeNode() }
	global.TreeNode = TreeNode

	beforeEach(function() {
		global.window = { location: { pathname: 'test/test' } }
		var dummyCore = reset()
		E2.commands.graph = require('../../scripts/commands/graphEditCommands')

		require('../../scripts/variables')
		require('../../scripts/util')

		app = E2.app = new Application()
		app.updateCanvas = function() {}
		core = E2.core = new Core()
		core.renderer = dummyCore.renderer
		E2.app.player = { core: core }
		core.active_graph = new Graph(core, null, new TreeNode())
		core.root_graph = core.active_graph
		core.graphs = [ core.active_graph ]

		// throw any errors
		global.msg = function(txt) {
			if (/^ERROR/.test(txt))
				throw new Error(txt)
		}

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

	it('clears arrayness', function() {
		var graph = E2.core.active_graph

		var floatNode1 = E2.app.instantiatePlugin('const_float_generator')
		var floatNode2 = E2.app.instantiatePlugin('const_float_generator')
		var inputsToArrayNode = E2.app.instantiatePlugin('inputs_to_array')
		var arraySwitchModulator = E2.app.instantiatePlugin('array_switch_modulator')

		var pullerNode = E2.app.instantiatePlugin('float_display')

		connect(graph, floatNode1, 0, inputsToArrayNode, 0, true)
		connect(graph, floatNode2, 0, inputsToArrayNode, 1, true)

		E2.app.graphApi.addSlot(graph, arraySwitchModulator, {
			type: E2.slot_type.input,
			name: '0',
			dt: arraySwitchModulator.plugin.lsg.dt
		})

		// connect array to revolver
		var arrayConn = connect(graph, inputsToArrayNode, 0, arraySwitchModulator, 0, true)

		floatNode1.plugin.state.val = 10
		floatNode2.plugin.state.val = 20

		connect(graph, arraySwitchModulator, 1, pullerNode, 0)

		arraySwitchModulator.plugin.lsg.infer_dt()

		// pull array, expect [10, 20]
		arraySwitchModulator.plugin.update_input({index: 0}, 0)
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), [10, 20])

		// disconnect
		disconnect(graph, arrayConn)

		// check with no inputs
		arraySwitchModulator.plugin.update_input({index: 0}, 0)
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 0)

		// connect a single float
		connect(graph, floatNode1, 0, arraySwitchModulator, 0, true)
		arraySwitchModulator.plugin.lsg.infer_dt()

		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 10)
	})

	it('propagates arrayness', function() {
		var graph = E2.core.active_graph

		var floatNode1 = E2.app.instantiatePlugin('const_float_generator')
		var floatNode2 = E2.app.instantiatePlugin('const_float_generator')
		var floatNode3 = E2.app.instantiatePlugin('const_float_generator')
		var inputsToArrayNode1 = E2.app.instantiatePlugin('inputs_to_array')
		var inputsToArrayNode2 = E2.app.instantiatePlugin('inputs_to_array')
		var arraySwitchModulator = E2.app.instantiatePlugin('array_switch_modulator')

		var pullerNode = E2.app.instantiatePlugin('float_display')

		connect(graph, floatNode1, 0, inputsToArrayNode1, 0, true)
		connect(graph, floatNode2, 0, inputsToArrayNode1, 1, true)

		connect(graph, floatNode2, 0, inputsToArrayNode2, 0, true)
		connect(graph, floatNode3, 0, inputsToArrayNode2, 1, true)

		E2.app.graphApi.addSlot(graph, arraySwitchModulator, {
			type: E2.slot_type.input,
			name: '0',
			dt: arraySwitchModulator.plugin.lsg.dt
		})

		E2.app.graphApi.addSlot(graph, arraySwitchModulator, {
			type: E2.slot_type.input,
			name: '1',
			dt: arraySwitchModulator.plugin.lsg.dt
		})

		// connect arrays to revolver
		var arrayConn1 = connect(graph, inputsToArrayNode1, 0, arraySwitchModulator, 0, true)
		var arrayConn2 = connect(graph, inputsToArrayNode2, 0, arraySwitchModulator, 1, true)

		floatNode1.plugin.state.val = 10
		floatNode2.plugin.state.val = 20
		floatNode3.plugin.state.val = 30

		connect(graph, arraySwitchModulator, 1, pullerNode, 0)

		arraySwitchModulator.plugin.lsg.infer_dt()

		// length
		assert.equal(arraySwitchModulator.plugin.update_output({index: 1}), 2)

		// select the second array, expect [20, 30]
		arraySwitchModulator.plugin.update_input({index: 0}, 1)
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), [20, 30])

		// select the first array, expect [10, 20]
		arraySwitchModulator.plugin.update_input({index: 0}, 0)
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), [10, 20])

		// disconnect
		E2.app.graphApi.disconnect(graph, arrayConn1)
		E2.app.onLocalConnectionChanged(arrayConn1)

		E2.app.graphApi.disconnect(graph, arrayConn2)
		E2.app.onLocalConnectionChanged(arrayConn1)

		// connect non-arrays to revolver
		var floatConn1 = connect(graph, floatNode1, 0, arraySwitchModulator, 0, true)
		var floatConn2 = connect(graph, floatNode2, 0, arraySwitchModulator, 1, true)

		arraySwitchModulator.plugin.lsg.infer_dt()

		floatNode1.plugin.state.val = 40
		floatNode2.plugin.state.val = 50
		floatNode1.plugin.updated = true
		floatNode2.plugin.updated = true

		graph.update()

		// length
		assert.equal(arraySwitchModulator.plugin.update_output({index: 1}), 2)

		// select first input, expect 40
		arraySwitchModulator.plugin.update_input({index: 0}, 0)
		graph.update()
		arraySwitchModulator.plugin.update_state()
		assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 40)

		// select second input, expect 50
		// ATTENTION: this doesn't work - pending bug #1090
		//arraySwitchModulator.plugin.update_input({index: 0}, 1)
		//graph.update()
		//arraySwitchModulator.plugin.update_state()
		//assert.deepEqual(arraySwitchModulator.plugin.update_output({index: 0}), 50)
	})
})



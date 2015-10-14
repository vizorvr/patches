var assert = require('assert');

var reset = require('../unit/plugins/helpers').reset;
var loadPlugin = require('../unit/plugins/helpers').loadPlugin;

global.E2 = {}
var Application = require('../../scripts/application')

global._ = require('lodash')
global.EventEmitter = require('../../scripts/event-emitter')
global.Node = require('../../scripts/node').Node
global.LinkedSlotGroup = require('../../scripts/node').LinkedSlotGroup
global.Graph = require('../../scripts/graph')
global.Flux = require('../../vendor/flux')
global.Plugin = require('../../scripts/plugin');
global.Store = require('../../scripts/store');
global.GraphStore = require('../../scripts/graphStore');
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

describe('Array function', function() {
	
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

	it('triggers for one frame only when system emits', function() {
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
			src_slot: 0,
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

	it('triggers for one frame only when writer emits', function() {
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
			src_slot: 0,
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

})

	

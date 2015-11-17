var assert = require('assert');
var reset = require('../unit/plugins/helpers').reset;
var fs = require('fs')

var loadPlugin = require('../unit/plugins/helpers').loadPlugin;

global.E2 = {
	uid: function() {},
	dt: {
		ANY: { id: 8, name: 'Arbitrary' },
		FLOAT: { id: 0, name: 'Float' }
	},
	slot_type: {
		input: 0,
		output: 1
	}
}

global.THREE = {
	Vector3: function(){},
	Matrix4: function(){},
	Color: function(){},
	Material: function(){},
	MeshBasicMaterial: function(){},
	PerspectiveCamera: function(){}
}
global.THREE.Matrix4.prototype.identity = function() {}

var Application = require('../../scripts/application')

global.msg = console.error
global.navigator = { userAgent: 'test' }

global._ = require('lodash')
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
global.SubGraphPlugin = require('../../scripts/subGraphPlugin')

global.NodeUI = function() {
	this.dom = [$()]
	this.dom.position = this.dom[0].position
	this.dom.width = this.dom[0].width
	this.dom.height = this.dom[0].height
	this.dom[0].style = {}
}
global.TextureCache = function() {}
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

function PluginManager(_a, _b, _c, _d) {
	EventEmitter.call(this)
	this.keybyid = {}
	var that = this
	process.nextTick(function () {
		that.emit('ready')
	})
}

PluginManager.prototype = Object.create(EventEmitter.prototype)
PluginManager.prototype.create = function (id, node) {
	if (!E2.plugins[id])
		loadPlugin(id)
	var p = new E2.plugins[id](core, node)
	p.id = id
	return p
}

global.PluginManager = PluginManager

function TreeNode() {
}

TreeNode.prototype.add_child = function () {
	return new TreeNode()
}

global.TreeNode = TreeNode

describe('SubGraphPlugin-Complex', function() {
	beforeEach(function() {
		var dummyCore = reset()
		E2.commands.graph = require('../../scripts/commands/graphEditCommands')
		global.window = { location: { pathname: 'test/test' } }
		require('../../scripts/util')
		var Core = require('../../scripts/core')

		E2.plugins.url_scene_generator = function(){
			this.input_slots = []
			this.output_slots = [ { name: 'x', dt: core.datatypes.BOOL } ]
		}

		global.E2.Variables = function() {
			this.serialise = function(){}
		}

		app = E2.app = new Application()
		app.worldEditor = { isActive: function() { return false } }
		app.updateCanvas = function() {}
		app.channel = { broadcast: function(){} }
		core = E2.core = new Core()
		core.renderer = dummyCore.renderer
		E2.app.player = { core: core }
		core.active_graph = new Graph(core, null, new TreeNode())
		core.root_graph = core.active_graph
		core.graphs = [ core.active_graph ]

		source = JSON.parse(fs.readFileSync(__dirname+'/../fixtures/subGraphFloatOutput.json')).root

		app.paste(source, 0, 0)

	})

	var FloatConsumerPlugin = function(core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Test plugin for consuming floats'

		this.input_slots = [
			{
				name: 'input',
				dt: core.datatypes.FLOAT
			}]

		this.output_slots = []
	}

	FloatConsumerPlugin.prototype = Object.create(Plugin.prototype)

	FloatConsumerPlugin.prototype.get_value = function(v) {
		return this.value
	}

	FloatConsumerPlugin.prototype.update_input = function(slot, data) {
		this.value = data
	}

	it('fetches numbers from subgraphs', function() {
		var ag = E2.core.active_graph

		var floatConsumerNode = new Node(ag, undefined, 0, 0)
		var floatConsumerPlugin = new FloatConsumerPlugin(E2.core, floatConsumerNode)
		floatConsumerNode.set_plugin(floatConsumerPlugin)
		floatConsumerPlugin.reset()

		ag.addNode(floatConsumerNode)

		var subgraph0 = ag.nodes[0]
		var subgraph1 = ag.nodes[1]
		var float0 = ag.nodes[2]

		var ss = subgraph0.dyn_outputs[0]
		var ds = floatConsumerNode.plugin.input_slots[0]
		var conn = new Connection(subgraph0, floatConsumerNode, ss, ds)
		ag.connect(conn)
		conn.patch_up(ag.nodes)

		ag.update()

		var v = floatConsumerPlugin.get_value()
		assert(v, 1)

		ag.disconnect(conn)

		ss = subgraph1.dyn_outputs[0]

		conn = new Connection(subgraph1, floatConsumerNode, ss, ds)
		ag.connect(conn)
		conn.patch_up(ag.nodes)

		var v = floatConsumerPlugin.get_value()
		assert(v, 2)

		ag.disconnect(conn)

		ss = float0.plugin.output_slots[0]

		conn = new Connection(float0, floatConsumerNode, ss, ds)
		ag.connect(conn)
		conn.patch_up(ag.nodes)

		var v = floatConsumerPlugin.get_value()
		assert(v, 3)
	})
})




var assert = require('assert');
var fs = require('fs')

var reset = require('./plugins/helpers').reset;
var loadPlugin = require('./plugins/helpers').loadPlugin;

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

describe('Paste', function() {
	var core, app

	beforeEach(function() {
		core = reset()
		core.active_graph = new Graph(core, null, {})
		core.graphs = [ core.active_graph ]
		
		E2.commands.graph = require('../../scripts/commands/graphEditCommands')

		app = E2.app = new Application()
		app.player = { core: core }
		app.channel = { broadcast: function(){}}
		app.updateCanvas = function(){}
		global.E2.app = app
	})

	describe('Simple', function() {

		var source = JSON.parse(fs.readFileSync(__dirname+'/fixtures/paste.json')).root

		it('pastes correctly', function() {
			app.paste(source, 0, 0)
			assert.equal(core.active_graph.nodes.length, 3)
			assert.equal(core.active_graph.connections.length, 2)
			assert.equal(core.active_graph.nodes[2].outputs.length, 2)
		})

		it('pastes correctly when repeated', function() {
			app.clipboard = source
			app.paste(source, 0, 0)
			app.paste(source, 0, 0)
			assert.equal(core.active_graph.nodes.length, 6)
			assert.equal(core.active_graph.connections.length, 4)
			assert.equal(core.active_graph.nodes[2].outputs.length, 2)
			assert.equal(core.active_graph.nodes[5].outputs.length, 2)
		})

		it('discards invalid connections', function() {
			app.clipboard = JSON.parse('{"nodes":[{"plugin":"url_texture_generator","x":246,"y":277,"uid":1430255492426139,"state":{"url":"/data/image/dfc79110aef8fa620fa7a4ff3fc3b116de0c5374.png"},"title":"Image"}],"conns":[{"src_nuid":1430255492426139,"dst_nuid":14302554924103,"src_slot":0,"dst_slot":1,"src_connected":true,"dst_connected":true,"dst_dyn":true}],"x1":296,"y1":327,"x2":437,"y2":448}')
			app.paste(app.clipboard, 0,0)
			assert.equal(core.active_graph.nodes.length, 1)
			assert.equal(core.active_graph.connections.length, 0)
		})

		it('sends the right events', function() {
			var nodeAdded = 0
			var connected = 0
			app.dispatcher.register(function(pl) {
				if (pl.actionType==='uiNodeAdded')
					nodeAdded++
				if (pl.actionType==='uiConnected')
					connected++
			})
			app.paste(source, 0, 0)
			assert.equal(nodeAdded, 3)
			assert.equal(connected, 2)
		})
	})

	describe('Complex', function() {
		var source
		
		global.window = global

		global.Renderer = function() {}

		var Core = require('../../scripts/core')
		
		function PluginManager(_a, _b, _c, _d) {
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
			var p = new E2.plugins[id](core, node)
			p.id = id
			return p
		}

		global.PluginManager = PluginManager

		global.Node.prototype.initialise = function(){}

		function TreeNode() {}
		TreeNode.prototype.add_child = function() { return new TreeNode() }
		global.TreeNode = TreeNode

		beforeEach(function() {
			var dummyCore = reset()
			E2.commands.graph = require('../../scripts/commands/graphEditCommands')

			app = E2.app = new Application()
			app.channel = { broadcast: function(){} }
			core = E2.core = new Core()
			core.renderer = dummyCore.renderer
			E2.app.player = { core: core }
			core.active_graph = new Graph(core, null, new TreeNode())
			core.root_graph = core.active_graph
			core.graphs = [ core.active_graph ]

			source = JSON.parse(fs.readFileSync(__dirname+'/fixtures/paste-complex.json')).root
		})

		it('creates the right number of nodes, connections and outputs', function() {
			app.paste(source, 0, 0)
			assert.equal(core.active_graph.nodes.length, 8)
			assert.equal(core.active_graph.connections.length, 7)
			assert.equal(core.active_graph.nodes[2].outputs.length, 1)
		})

		it('sends the right events', function() {
			var nodeAdded = 0
			var connected = 0
			app.dispatcher.register(function(pl) {
				if (pl.actionType==='uiNodeAdded')
					nodeAdded++
				if (pl.actionType==='uiConnected')
					connected++
			})
			app.paste(source, 0, 0)
			assert.equal(nodeAdded, 8)
			assert.equal(connected, 7)
		})

		it('creates a subgraph in the right place', function() {
			app.paste(source, 0, 0)
			assert.equal(core.graphs[2].plugin.id, 'graph')
		})

		it('sets up the right parent relationships', function() {
			app.paste(source, 0, 0)
			console.log('graph', core.graphs[1])
			assert.equal(
				core.graphs[1].nodes[0]
					.plugin.node.parent_graph, // input proxy's parent
				core.graphs[1].uid
			)
		})

		// this doesn't really belong here, but it's a good case to have
		it('has the correct number of connections after removing a node', function() {
			var ag = core.active_graph
			app.paste(source, 0, 0)
			assert.equal(ag.connections.length, 7)
			app.graphApi.removeNode(ag, ag.nodes[3])
			assert.equal(ag.connections.length, 6)
		})

	})

	

})








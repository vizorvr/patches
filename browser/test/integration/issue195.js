var assert = require('assert');
var fs = require('fs')

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
	this.setSelected = function(){}
}

global.PresetManager = function() {}
global.UIbreadcrumb = function() {
	return {
		prepend: function() {},
		render: function() {}
	}
}

require('../../scripts/commands/graphEditCommands')

global.TextureCache = function(){}

global.THREE = {
	Vector3: function(){},
	Matrix4: function(){},
	Color: function(){},
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

describe('Redo complex connection', function() {
	var source
	
	global.window = global

	global.Renderer = function() {}
	Renderer.blend_mode = {
		NORMAL: 0
	}

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
		global.window = { location: { pathname: 'test/test' } }
		var dummyCore = reset()
		E2.commands.graph = require('../../scripts/commands/graphEditCommands')

		require('../../scripts/variables')
		require('../../scripts/util')

		E2.plugins.convert_camera_matrices = function(core) {
				this.input_slots = [
					{ name: 'camera', dt: core.datatypes.CAMERA },
				]
				this.output_slots = [
					{ name: 'projection', dt: core.datatypes.MATRIX},
					{ name: 'view', dt: core.datatypes.MATRIX }
				]
		}
		E2.plugins.material_texture_modulator = function(core, node) {
			this.input_slots = [ 
				{ name: 'material', dt: core.datatypes.MATERIAL},
				{ name: 'type', dt: core.datatypes.FLOAT},
				{ name: 'texture', dt: core.datatypes.TEXTURE }
			];
			
			this.output_slots = [
				{ name: 'material', dt: core.datatypes.MATERIAL }
			];
		};

		app = E2.app = new Application()
		app.worldEditor = { isActive: function() { return false } }
		app.updateCanvas = function() {}
		core = E2.core = new Core()
		core.renderer = dummyCore.renderer
		E2.app.player = { core: core }
		core.active_graph = new Graph(core, null, new TreeNode())
		core.root_graph = core.active_graph
		core.graphs = [ core.active_graph ]
		core.renderer.context = {
			bindBuffer: function(){},
			bufferData: function(){},
			createBuffer: function(){}
		}

		// throw any errors
		global.msg = function(txt) {
			if (/^ERROR/.test(txt))
				throw new Error(txt)
		}

		source = JSON.parse(fs.readFileSync(__dirname+'/../fixtures/issue195.json')).root
	})

	it('can redo connection after destructive edits in subgraph, issue #195', function() {
		app.setupStoreListeners()
		app.clipboard = JSON.stringify(source)

		// add VR clean template
		app.onPaste()
		
		var rootGraph = E2.core.active_graph
		rootGraph.create_ui = function(){}
		rootGraph.tree_node = {}
		
		// open the VR render loop
		var vrLoopGraph = rootGraph.children[0].plugin.graph
		vrLoopGraph.create_ui = function(){}
		vrLoopGraph.tree_node = {}
		
		app.onGraphSelected(vrLoopGraph)

		// select all, delete
		app.clearSelection()
		vrLoopGraph.nodes.map(function(node) {
			app.markNodeAsSelected(node)
		})

		assert.equal(app.selectedNodes.length, 2)

		app.onDelete()

		// back to root graph
		app.onGraphSelected(rootGraph)

		// undo, undo, redo
		app.undoManager.undo() // undo deletion inside subgraph
		app.undoManager.undo() // undo addition of pasted nodes
		assert.doesNotThrow(function() {
			app.undoManager.redo() // redo pasted nodes
		})

	})

})

	

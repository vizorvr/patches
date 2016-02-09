var assert = require('assert');

var reset = require('../unit/plugins/helpers').reset;
var loadPlugin = require('../unit/plugins/helpers').loadPlugin;
var fs = require('fs');

global.document = {
	createElement: function() {
	return {
		src: '',
	}},
	getElementsByTagName: function() {
		return [{
			appendChild: function() {}
		}]
	}
}

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

global.window = global

global.BlendFunctions = require(__dirname + '/../../scripts/blendFunctions.js')
global.AbstractAnimateValueOnTriggerPlugin = require(__dirname + '/../../scripts/abstractAnimateValueOnTriggerPlugin.js')
global.AbstractArrayBlendModulatorPlugin = require(__dirname + '/../../scripts/abstractArrayBlendModulatorPlugin.js')
global.AbstractObjectGazePlugin = require(__dirname + '/../../scripts/abstractObjectGazePlugin.js')
global.ThreeObject3DPlugin = require(__dirname + '/../../scripts/threeObject3dPlugin.js')
global.AbstractThreeMaterialPlugin = require(__dirname + '/../../scripts/abstractThreeMaterialPlugin.js')
global.AbstractThreeMeshPlugin = require(__dirname + '/../../scripts/abstractThreeMeshPlugin.js')
global.AbstractThreeLoaderObjPlugin = require(__dirname + '/../../scripts/abstractThreeLoaderObjPlugin.js')

global.load_script = require(__dirname + '/../../scripts/util.js')

require('../../scripts/commands/graphEditCommands')

global.TextureCache = function(){}


function Color() {}
Color.prototype.setRGB = function(r, g, b) {
	this.r = r
	this.g = g
	this.b = b
}
Color.prototype.setHSL = function() {

}

global.THREE = {
	Vector2: function(){},
	Vector3: function(){
		this.subVectors = function() {}
		this.normalize = function() {}
		this.crossVectors = function() {}
		this.clone = function() {}
	},
	Matrix4: function(){},
	Color: Color,
	Material: function(){},
	MeshBasicMaterial: function(){},
	PerspectiveCamera: function(){
		this.channels = {
			enable: function() {}
		}
	},
	Math: {clamp:function(){}},
	CubeTexture: function(){},
	ShaderLib: {'cube': {uniforms: {'tCube':{value:0}}}},
	ShaderMaterial: function(){},
	BoxGeometry: function(){},
	Mesh: function(){},
	Quaternion: function(){},
	Object3D: function() {
		this.position = {
			set: function() {}
		}
	},
	AmbientLight: function() {},
	DirectionalLight: function() {},
	PointLight: function() {},
	SpotLight: function() {},
	HemisphereLight: function() {},
	Geometry: function() {
		this.vertices = []
		this.faces = []
		this.faceVertexUvs = [[]]
	},
	BufferGeometry: function() {
		this.fromGeometry = function(){}
	},
	Face3: function() {},
	MeshFaceMaterial: function() {},
	CircleGeometry: function() {},
	CylinderGeometry: function() {},
	DodecahedronGeometry: function() {},
	PlaneGeometry: function() {},
	SphereGeometry: function() {},
	SphereBufferGeometry: function() {},
	Group: function() {},
	LineBasicMaterial: function() {},
	LineSegments: function() {},
	Loader: {
		Handlers: {
			add: function() {}
		}
	},
	DDSLoader: function() {},
	MeshDepthMaterial: function() {},
	MeshLambertMaterial: function() {},
	MeshPhongMaterial: function() {},
	MeshBasicMaterial: function() {},
	PointCloudMaterial: function() {},
	PointCloud: function() {},
	Euler: function() {},
	Scene: function() {
		this.add = function() {}
		this.children = [{add: function(){}}]
	},
	Texture: function() {},
	VRControls: function() {},
	VREffect: function(){
		this.setSize = function(){}
	},
	Camera: function(){}
}
THREE.Object3D.prototype = {
	position: {set: function(){}},
	quaternion: {set: function(){}},
	scale: {set: function(){}},
	add: function() {},
	remove: function() {},
}
THREE.Geometry.prototype = Object.create(Plugin.prototype)
THREE.Group.prototype = Object.create(THREE.Object3D.prototype)
THREE.PerspectiveCamera.prototype = Object.create(THREE.Object3D.prototype)

global.WebVRManager = function(){}
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

var pluginPath = './browser/plugins/'

describe('loadAllPlugins', function() {

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
		E2.EnvironmentSettings = function(){}
		E2.Noise = function() {this.noise2D = function(){}}

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
		core.renderer = {setPixelRatio: function(){}}

		E2.dom = E2.dom || {}
		E2.dom.webgl_canvas = {
			on:function(){},
			bind:function(){},
			'0': {
				clientWidth:1,
				clientHeight:1
			}
		}


		// throw any errors
		global.msg = function(txt) {
			if (/^ERROR/.test(txt))
				throw new Error(txt)
		}

	})

	var exceptions = [
		// legacy plugins used in unit tests (paste_complex
		'mesh_renderer_emitter',
		'perspective_camera',
		'grid_mesh_generator',
		'concatenate_matrix_modulator',
		'scene_renderer_emitter',

		// these will need to be fixed:
		'viewport_height_generator',
		'viewport_width_generator',
	]

	it('loads all plugins', function(done) {
		fs.readdir(pluginPath, function(err, files) {
			if (err) {
				console.error(err);
				return
			}

			for(var i = 0; i < files.length; ++i) {
				var filename = pluginPath + files[i]
				var pluginName = files[i].replace('\.plugin\.js', '')
				if (pluginName.indexOf('.') !== -1 || exceptions.indexOf(pluginName) !== -1) {
					// skip
					continue
				}
/*
				function statFun(err, stat) {
					if (err) {
						console.error(err)
						return
					}

					console.error(doneCount, this.plugin)

					var plug = E2.app.instantiatePlugin(this.plugin)
					++doneCount
					if(doneCount >= files.length) {
						done()
					}
				}

				fs.stat(filename, statFun.bind({plugin: pluginName}))
*/
				var stat = fs.statSync(filename)
				if (stat.isFile()) {
					console.error(pluginName)
					var plug = E2.app.instantiatePlugin(pluginName)
				}
			}
			done()
		})
	})
})
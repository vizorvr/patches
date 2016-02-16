var fs = require('fs');
var vm = require('vm');
var when = require('when')
var browserPath = __dirname+'/../../';
var EventEmitter = require('events').EventEmitter

var requireRoot = browserPath

var _ = require('lodash')

global.clone = _.cloneDeep.bind(_)

global.SubGraphPlugin = require(browserPath+'scripts/subGraphPlugin.js')
global.Plugin = require(browserPath+'scripts/plugin.js')

global.EventEmitter = require('events').EventEmitter
global.Node = require(browserPath+'scripts/node.js').Node
global.LinkedSlotGroup = require(browserPath+'scripts/node.js').LinkedSlotGroup

exports.slot = function slot(index, type, dt) {
	return {
		index: index,
		type: type,
		dt: dt
	};
}

exports.mockE2Classes = function() {
	global.AssetLoader = function AssetLoader() {
		EventEmitter.call(this)
		this.defaultTexture = {}
		this.loadingTexture = {}
	}

	global.AssetLoader.prototype = Object.create(EventEmitter.prototype)
	global.AssetLoader.prototype.loadAsset = function() {
		return when.resolve()
	}

	global.PluginManager = function() {
		this.keybyid = {}
	}
	global.PluginManager.prototype = Object.create(EventEmitter.prototype)
	global.PluginManager.prototype.create = function(id, node) {
		exports.loadPlugin(id)
		var p = new E2.plugins[id](E2.core, node);
		p.id = id
		return p
	}

	global.E2.GraphAnalyser = function() {}
	global.E2.GraphAnalyser.prototype.analyseGraph = function(){
		return when.resolve()
	}

	global.E2.GridFsClient = function() {}

	global.E2.EnvironmentSettings = function(){}

	global.E2.EnvironmentSettings = function(){}
	global.E2.Noise = function() {this.noise2D = function(){}}

	global.mixpanel = { track: function() {}}
}

function Color() {}
	Color.prototype.setRGB = function(r, g, b) {
		this.r = r
		this.g = g
		this.b = b
	}
	Color.prototype.setHSL = function() {
}

exports.setupThree = function() {
	global.THREE = {
		Vector2: function(){},
		Vector3: function(){
			this.subVectors = function() {}
			this.normalize = function() {}
			this.crossVectors = function() {}
			this.clone = function() {}
		},
		Matrix4: function() {},
		Color: Color,
		Material: function(){},
		MeshBasicMaterial: function(){},
		PerspectiveCamera: function(){
			this.layers = {
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
}


exports.reset = function() {
	global.E2 = {}
	global.window = global
	global.addEventListener = function() {}
	global.location = {
		pathname: 'test/test'
	}

	global.Vizor = {}

	global.CustomEvent = function(){}

	function domNode() {
		return {
			src: '',
			style: {},
			addEventListener: global.addEventListener,
			appendChild: function() {},
			dispatchEvent: function() {}
		}
	}

	global.document = {
		addEventListener: global.addEventListener,
		body: domNode(),
		createElement: function() {
			return domNode()
		},
		getElementsByTagName: function() {
			return [ domNode() ]
		}
	}

	global.navigator = {
		userAgent: 'node'
	}

	global.WebVRConfig = {}

	exports.runScript(browserPath+'dist/engine.js')
	exports.mockE2Classes()

	var Application = require(browserPath+'scripts/application.js')
	
	E2.core = new Core()

	E2.plugins = {}
	E2.commands = {}

	exports.setupGlobals()

	// throw any errors
	global.msg = function(txt) {
		if (/^ERROR/.test(txt))
			throw new Error(txt)

		console.log.apply(console, arguments)
	}

	function leftTop(){ return { left: 0, top: 0 }}

	global.mat4 = {
		create: function() {},
		identity: function(){}
	}

	global.$ = function() { return {
		length: 1,
		addClass: function(){},
		removeClass: function(){},
		click: function(){},
		text: function(){},
		offset: leftTop,
		position: leftTop,
		css: function(){ return 0 },
		width: function(){ return 0 },
		height: function(){ return 0 },
		position: function(){ return 0 },
		remove: function(){ },
		movable: function(){},
		popover:function(){},
		removeClass:function(){},
		keydown:function(){},
		keyup:function(){},
		mousemove:function(){},
		outerHeight:function(){},
		'0': {
			getContext: function(){}
		}
	}}

	E2.dom = {
		breadcrumb: {
			children: function() { return $() },
			prepend: function() {}
		},
		canvas: [{ getContext: function(){} }],
		canvas_parent: $(),
		canvases: $()
	}

	E2.dom.webgl_canvas = {
		on:function(){},
		bind:function(){},
		'0': {
			clientWidth:1,
			clientHeight:1
		}
	}

	global.make = function() {
		return $()
	}

	E2.dom.canvas_parent.scrollTop = E2.dom.canvas_parent.scrollLeft = 
		function() { return 0; }

	global.E2.app = new Application()
	global.E2.app.updateCanvas = function() {}
	global.E2.app.getSlotPosition = function() {}
	global.E2.app.channel = {
		broadcast: function(){}
	}

	global.E2.app.worldEditor = {
		isActive: function() {
			return false
		}
	}

	global.E2.app.player = { core: E2.core }

	E2.core.active_graph = new Graph(E2.core, null, {})
	E2.core.root_graph = E2.core.active_graph
	E2.core.graphs = [ E2.core.active_graph ]
	
	E2.core.renderer = {
		setPixelRatio: function() {},
		domElement: {},
		setSize: function(){},
		setClearColor: function() {},
		getSize: function() {return {width: 1, height: 1}}
	}

	return E2.core;
}

exports.runScript = function(path) {
	var js = fs.readFileSync(path)
	vm.runInThisContext(js, path)
}

exports.loadPlugin = function(name) {
	var js = fs.readFileSync(browserPath+'plugins/'+name+'.plugin.js');
	vm.runInThisContext(js, name);
}

exports.setupGlobals = function() {
	global._ = require('lodash')
	global.EditorChannel = function(){}

	// global.Graph = require(requireRoot+'/scripts/graph')
	global.Flux = require(requireRoot+'/vendor/flux')
	global.Store = require(requireRoot+'/scripts/stores/store');
	global.GraphStore = require(requireRoot+'/scripts/stores/graphStore');

	global.PeopleManager = function() {}

	global.PeopleStore = function(){}
	global.PeopleStore.prototype.list = function() {
		return []
	}

	global.NodeUI = function() {
		this.dom = [$()]
		this.dom.position = this.dom[0].position
		this.dom.width = this.dom[0].width
		this.dom.height = this.dom[0].height
		this.dom[0].style = {}
		this.setSelected = function(){}
		this.redrawSlots = function(){}
	}

	global.TextureCache = function() {}
	global.PresetManager = function() {}
	
	require(requireRoot+'/scripts/commands/graphEditCommands')
	exports.runScript(requireRoot+'scripts/commands/graphEditCommands.js')
	
	global.UndoManager = require(requireRoot+'/scripts/commands/undoManager.js')
	global.GraphApi = require(requireRoot+'/scripts/graphApi.js')

	global.ConnectionUI = require(requireRoot+'/scripts/connection.js').ConnectionUI
	global.ConnectionUI.prototype.resolve_slot_divs = function() {
		this.src_slot_div = $()
		this.dst_slot_div = $()
	}

	E2.ui = {
		buildBreadcrumb: function() {},
		state: {}
	}
}

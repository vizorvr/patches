var fs = require('fs');
var vm = require('vm');
var browserPath = __dirname+'/../../../';
var EventEmitter = require('events').EventEmitter

var when = require('when')

var _ = require('lodash')

global.clone = _.cloneDeep.bind(_)

global.Plugin = require(browserPath+'scripts/plugin.js')
global.SubGraphPlugin = require(browserPath+'scripts/subGraphPlugin.js')

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

	global.E2.GraphAnalyser = function() {}
	global.E2.GraphAnalyser.prototype.analyseGraph = function(){
		return when.resolve({ size: 0, numAssets: 0 })
	}

	global.E2.GridFsClient = function() {}
}

exports.reset = function() {
	if (typeof(global.E2) === 'undefined')
		global.E2 = {}

	E2 = global.E2

	E2.slot_type = { input: 0, output: 1 }
	
	E2.GRAPH_NODES = ['graph', 'loop', 'array_function'];

	E2.dt = {
		FLOAT: { id: 0, name: 'Float' },
		SHADER: { id: 1, name: 'Shader' },
		TEXTURE: { id: 2, name: 'Texture' },
		COLOR: { id: 3, name: 'Color' },
		MATRIX: { id: 4, name: 'Matrix' },
		VECTOR: { id: 5, name: 'Vector' },
		CAMERA: { id: 6, name: 'Camera' },
		BOOL: { id: 7, name: 'Boolean' },
		ANY: { id: 8, name: 'Arbitrary' },
		MESH: { id: 9, name: 'Mesh' },
		AUDIO: { id: 10, name: 'Audio' },
		SCENE: { id: 11, name: 'Scene' },
		MATERIAL: { id: 12, name: 'Material' },
		LIGHT: { id: 13, name: 'Light' },
		DELEGATE: { id: 14, name: 'Delegate' },
		TEXT: { id: 15, name: 'Text' },
		VIDEO: { id: 16, name: 'Video' },
		ARRAY: { id: 17, name: 'Array' },
		OBJECT: { id: 18, name: 'Object' }
	};

	E2.plugins = {}

	if (!global.E2.app)
		global.E2.app = {}

	exports.mockE2Classes()

	global.E2.app.getSlotPosition = function() {}
	global.E2.app.channel = {
		broadcast: function(){}
	}

	global.msg = function() {
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

	var graphCounter = 0
	core = {
		datatypes: E2.dt,
		get_uid: E2.uid,
		assetLoader: new AssetLoader(),
		renderer: {
			context: {},
			canvas: [$()],
			on: function(){}
		},
		graphs: [],
		get_default_value: function(dt) {
			return null
		},
		on: function(){}
	};

	core.pluginManager = {
		create: function(id, node) {
			exports.loadPlugin(id)
			var p = new E2.plugins[id](core, node);
			p.id = id
			return p
		},
		keybyid: {}
	}

	E2.core = core
	E2.dt = core.datatypes
	E2.core.resolve_dt = { 0: E2.dt.FLOAT }
	E2.commands = {}
	E2.slot_type = { input: 0, output: 1 };

	var uidCounter = 0
	E2.core.get_uid = E2.uid = function() {
		return Date.now() + '-' + uidCounter++
	}

	E2.dom = {
		breadcrumb: {
			children: function() { return $() },
			prepend: function() {}
		},
		canvas: [{ getContext: function(){} }],
		canvas_parent: $(),
		canvases: $()
	}

	global.make = function() {
		return $()
	}

	E2.dom.canvas_parent.scrollTop = E2.dom.canvas_parent.scrollLeft = 
		function() { return 0; }

	return core;
}

exports.loadPlugin = function(name) {
	var js = fs.readFileSync(browserPath+'plugins/'+name+'.plugin.js');
	vm.runInThisContext(js, name);
}

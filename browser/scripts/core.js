/*
The MIT License (MIT)

Copyright (c) 2011 Lasse Jul Nielsen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
and associated documentation files (the "Software"), to deal in the Software without restriction, 
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial 
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
if (typeof(E2) === 'undefined')
	E2 = {}

if (typeof(module) !== 'undefined') {
	var EventEmitter = require('events').EventEmitter
}

var URL_DATA = '/data/'
var URL_GRAPHS = '/graph/'
var URL_GRAPH_FILES = URL_DATA+'graph/'

// disable DPDB (device database) fetching for WebVR boilerplate because
// the list in the device database doesn't have Samsung S6 on the list.
if (typeof(window) !== 'undefined') {
	window.E2 = E2 // global scope so plugins can access it

	window.WebVRConfig = window.WebVRConfig || {}
	window.WebVRConfig.NO_DPDB_FETCH = true
	//window.WebVRConfig.ENABLE_DEPRECATED_API = true
	// These can be used to force VR on desktop
	//window.WebVRConfig.FORCE_ENABLE_VR = true
	//window.WebVRConfig.FORCE_DISTORTION = true
}

E2.app = null;
E2.ui = null;	// app sets this to a VizorUI instance
E2.dom = {};
E2.plugins = {};
E2.slot_type = { input: 0, output: 1 };
E2.erase_color = '#ff3b3b';
E2.COLOR_COMPATIBLE_SLOT = '#080';

E2.WORLD_PATCHES = [
	'entity', 'threesixty_photo_entity',
	'entity_component'
]

E2.GRAPH_NODES = [
	'graph', 'loop', 
	'array_function', 'spawner'
].concat(E2.WORLD_PATCHES)

E2.LOADING_NODES = {
	'three_loader_model': 'model',
	'three_loader_scene': 'scene',
	'url_texture_generator': 'texture',
	'url_stereo_cubemap_generator': 'image',
	'url_stereo_latlongmap_generator': 'image',
	'url_audio_buffer_generator': 'audiobuffer',
	'url_video_generator': 'video',
	// 'url_audio_generator': 'audio',
	// 'url_json_generator': 'json',
}

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
	ARRAY: { id: 17, name: 'Typed Array' },
	OBJECT: { id: 18, name: 'Object' },

	GEOMETRY: { id: 19, name: 'Geometry' },
	QUATERNION: { id: 20, name: 'Quaternion' },
	OBJECT3D: { id: 21, name: 'Object3D' },
	
	VECTOR4: { id: 22, name: 'Vector 4' },

	ENVIRONMENTSETTINGS: { id: 23, name: 'Environment Settings' },

	CUBETEXTURE: { id: 24, name: 'CubeTexture' },
}

E2.uid = function() {
	var keys = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
	var uid = ''
	for (var i=0; i < 12; i++) {
		uid += keys[Math.floor(Math.random() * keys.length)]
	}
	return uid
}

function Delegate(delegate, dt, count) {
	this.delegate = delegate;
	this.dt = dt;
	this.count = count;
}

function Core() {
	EventEmitter.apply(this, arguments)

	E2.core = this

	this.datatypes = E2.dt

	this.renderer = { // compat for old plugins
		matrix_identity: new THREE.Matrix4().identity(),
		vector_origin: new THREE.Vector3(),
		material_default: new THREE.MeshBasicMaterial(),
		color_white: new THREE.Color(0xffffff),
		color_black: new THREE.Color(0x000000),
		blend_mode: {
			NORMAL: 1
		}
	}

	this._listeners = {};
	
	this.runtimeEvents = new EventEmitter()

	this.assetLoader = new AssetLoader()

	// relay events from AssetLoader
	this.assetLoader.on('progress', function(pct) {
		if (pct % 10 === 0)
			console.log('core progress', pct)
		E2.core.emit('progress', pct)
	})

	this.webVRAdapter = new VizorWebVRAdapter()

	this.active_graph_dirty = true;

	this.active_graph = this.root_graph = null
	this.graphs = []
	
	this.abs_t = 0.0;
	this.delta_t = 0.0;
	this.graph_uid = this.get_uid()
	this.uidCounter = 0

	this.pluginManager = new PluginManager(this, '/plugins');

	this.pluginManager.on('ready', function() {
		this.onPluginsLoaded()
	}.bind(this))

	this.aux_scripts = {};
	this.aux_styles = {};
	this.resolve_dt = []; // Table for easy reverse lookup of dt reference by id.
	this.audioContext = null;
	
	for(var i in this.datatypes) {
		var dt = this.datatypes[i];
		
		this.resolve_dt[dt.id] = dt;
	}

	if (Vizor.isEditor || Vizor.hasAudio)
		this.createAudioContext()
}

Core.prototype = Object.create(EventEmitter.prototype)

Core.prototype.createAudioContext = function() {
	if (this.audioContext)
		return this.audioContext

	// HTML5 audio context initialisation
	if (window.AudioContext)
		this.audioContext = new AudioContext()
	else if (window.webkitAudioContext)
		this.audioContext = new webkitAudioContext()
	else
		msg('NOTE: This host has no AudioContext support.')

	return this.audioContext
}

Core.prototype.get_uid = function() {
	return E2.uid()
}

Core.prototype.update = function(abs_t, delta_t)
{
	this.abs_t = abs_t;
	this.delta_t = delta_t;

	var updateContext = {
		abs_t: this.abs_t,
		delta_t: this.delta_t
	}

	this.root_graph.update(updateContext);
			
	var dirty = this.active_graph_dirty;
			
	this.active_graph_dirty = false;
			
	return dirty; // Did connection state change?
};


Core.prototype.create_dialog = function(diag, title, w, h, done_func, open_func)
{
	var modal = bootbox.dialog({
		title: title,
		message: diag,
		buttons: {'OK': function(){}}
	})

	function close()
	{
		modal.unbind();
		modal.remove();
	}

	function ok()
	{
		done_func();
		modal.modal('hide');
	}

	modal.on('show.bs.modal', function()
	{
		$('.modal-dialog', modal).css('width', w + 40).addClass('patch-inspector');
	});

	modal.on('shown.bs.modal', function()
	{
		if(open_func)
			open_func();
	});

	modal.on('hidden.bs.modal', close);
	modal.modal({ keyboard: true });

	modal.on('keypress', function(e)
	{
		if(e.keyCode === 13)
		{
			if(e.target.nodeName !== 'TEXTAREA')
				ok();
		}
	})

	$('button:last', modal).click(ok);
};

Core.prototype.get_default_value = function(dt) {
	var dts = this.datatypes;
	
	if(dt === dts.FLOAT)
		return 0.0;
	else if(dt === dts.COLOR)
		return new THREE.Color(1, 1, 1, 1)
	else if(dt === dts.MATRIX) {
		return new THREE.Matrix4()
	} else if(dt === dts.VECTOR)
		return new THREE.Vector3(0, 0, 0)
	else if(dt === dts.CAMERA)
		return new THREE.PerspectiveCamera()
	else if(dt === dts.BOOL)
		return false;
	else if(dt === dts.TEXT)
		return '';
	else if(dt === dts.ARRAY) {
		var a = new ArrayBuffer(0);
		a.stride = a.datatype = 1; // Uint8
		return a;
	} else if(dt === dts.OBJECT)
		return {};
	
	// Shaders, textures, materials, scenes, light and delegates and ALL legally defaults to null.
	return null;
};

Core.prototype.serialise = function() {
	return JSON.stringify(this.serialiseToObject());
};

Core.prototype.serialiseToObject = function() {
	var d = {};
	
	d.abs_t = Math.round(this.abs_t * Math.pow(10, 4)) / Math.pow(10, 4);
	d.active_graph = this.active_graph.uid;
	d.graph_uid = this.graph_uid;
	d.root = this.root_graph.serialise();
	
	return d
};

Core.prototype.deserialiseObject = function(d) {
	this.abs_t = d.abs_t;
	this.delta_t = 0.0;
	this.graph_uid = '' + d.graph_uid;

	this.active_graph.destroy_ui()
	
	this.graphs = [];
	
	this.root_graph = new Graph(this, null, null);
	this.root_graph.deserialise(d.root);
	this.graphs.push(this.root_graph);
	
	this.root_graph.patch_up(this.graphs);
	this.root_graph.initialise(this.graphs);
	
	this.active_graph = resolve_graph(this.graphs, ''+d.active_graph); 

	if(!this.active_graph) {
		msg('ERROR: The active graph (ID: ' + d.active_graph + ') is invalid. Using the root graph.');
		this.active_graph = this.root_graph;
	}

	return this.root_graph
}

Core.prototype.deserialise = function(str) {
	return this.deserialiseObject(JSON.parse(str))
}

Core.prototype.rebuild_structure_tree = function() {
	function build(graph, name) {
		var nodes = graph.nodes;
		
		if (graph.parent_graph) {
			var ptn = graph.parent_graph.tree_node;
			var tnode = new TreeNode(ptn.tree, ptn, name, graph);
			
			ptn.children.push(tnode);
		}
		
		for(var i = 0, len = nodes.length; i < len; i++) {
			var n = nodes[i];

			if(n.plugin.isGraph)
				build(n.plugin.graph, n.get_disp_name());
		}
	}

	if (!E2.dom.structure)
		return;

	E2.dom.structure.tree.reset();
	this.root_graph.tree_node = E2.dom.structure.tree.root;
	E2.dom.structure.tree.root.graph = this.root_graph;
	build(this.root_graph, 'Root');
	E2.dom.structure.tree.root.rebuild_dom();
};

Core.prototype.add_aux_script = function(script_url, onload) {
	var that = this
	var dfd = when.defer()

	if (this.aux_scripts.hasOwnProperty(script_url)) {
		if (onload) 
			onload()

		dfd.resolve()
	} else {
		E2.util.loadScript('/plugins/' + script_url, function() {
			that.aux_scripts[script_url] = true

			if (onload)
				onload()

			dfd.resolve()
		}, function(err) {
			dfd.reject(err)
		})
	}

	return dfd.promise
};

Core.prototype.add_aux_style = function(style_url) {
	if(this.aux_styles.hasOwnProperty(style_url))
		return;
	
	load_style('/plugins/' + style_url);
	this.aux_styles[style_url] = true;
}

Core.prototype.onPluginsLoaded = function() {
	this.emit('ready');
}

if (typeof(module) !== 'undefined') {
	module.exports = Core
	module.exports.E2 = E2
}

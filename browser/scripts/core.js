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

var URL_GRAPHS = '/data/graphs/'

var E2 = {};
window.E2 = E2; // global scope so plugins can access it

E2.app = null;
E2.dom = {};
E2.plugins = {};
E2.slot_type = { input: 0, output: 1 };
E2.erase_color = '#ff3b3b';

function Delegate(delegate, dt, count)
{
	this.delegate = delegate;
	this.dt = dt;
	this.count = count;
}

function SnippetManager(base_url)
{
	var self = this;
	
	this.listbox = $('#snippets-list');
	this.base_url = base_url;
	
	var url = self.base_url + '/snippets.json';
	
	$.ajax({
		url: url,
		dataType: 'json',
		async: false,
		headers: {},
		success: function(data) 
		{
			msg('SnippetsMgr: Loading snippets from: ' + url);

			$.each(data, function(key, snippets)
			{
				self.register_group(key);
				
				$.each(snippets, function(name, id)
				{
					self.register_snippet(name, self.base_url + '/' + id + '.json')
				});
			});
		},
		error: function()
		{
			msg('SnippetsMgr: No snippets found.');
		}
	});
	
	var load = function()
	{
		var url = self.listbox.val();
		
		msg('Loading snippet from: ' + url);
		
		$.ajax({
			url: url,
			dataType: 'json',
			async: false,
			headers: {},
			success: function(data)
			{
	  			E2.app.fillCopyBuffer(data.root.nodes, data.root.conns, 0, 0);
	  			E2.app.onPaste({ target: { id: 'notpersist' }});
	  		},
	  		error: function()
	  		{
	  			msg('ERROR: Failed to load the selected snippet.', 'Cogent');
	  		}
		});
	};
	
	$('#load-snippet').button().click(load);
	this.listbox.dblclick(load);
}

SnippetManager.prototype.register_group = function(label)
{
	this.listbox.append('<optgroup label="' + label + '" class="snippet-group"></optgroup>');
};

SnippetManager.prototype.register_snippet = function(name, url)
{
	this.listbox.append('<option value="' + url + '">' + name + '</option>');
};

function AssetTracker(core)
{
	this.core = core;
	this.started = 0;
	this.completed = 0;
	this.failed = 0;
	this.listeners = [];
}

AssetTracker.prototype.add_listener = function(listener)
{
	this.listeners.push(listener);
};

AssetTracker.prototype.remove_listener = function(listener)
{
	this.listeners.remove(listener);
};

AssetTracker.prototype.signal_started = function()
{
	this.started++;
	this.signal_update();
};

AssetTracker.prototype.signal_completed = function()
{
	this.completed++;
	this.signal_update();
};

AssetTracker.prototype.signal_failed = function()
{
	this.failed++;
	this.signal_update();
};

AssetTracker.prototype.signal_update = function()
{
	var l = this.listeners;
	
	if(E2.dom.load_spinner)
		E2.dom.load_spinner.css('display', this.started === (this.completed + this.failed) ? 'none' : 'inherit');
	
	for(var i = 0, len = l.length; i < len; i++)
		l[i]();
};

function Core(app) {
	var self = this;
	
	this.datatypes = {
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
	
	this.asset_tracker = new AssetTracker(this);
	this.renderer = new Renderer('#webgl-canvas', this);
	this.active_graph = this.root_graph = null;
	this.active_graph_dirty = true;
	this.graphs = [];
	this.abs_t = 0.0;
	this.delta_t = 0.0;
	this.graph_uid = 0;
	this.app = app;
	this.plugin_mgr = new PluginManager(this, 'plugins', E2.app ? E2.app.onPluginInstantiated : null);
	this.registers = new Registers(this);
	this.aux_scripts = {};
	this.aux_styles = {};
	
	this.resolve_dt = []; // Make a table for easy reverse lookup of dt reference by id.
	
	for(var i in this.datatypes)
	{
		var dt = this.datatypes[i];
		
		this.resolve_dt[dt.id] = dt;
	}
	
	this.get_graph_uid = function()
	{
		return self.graph_uid++;
	};
	
	this.update = function(abs_t, delta_t)
	{
		self.abs_t = abs_t;
		self.delta_t = delta_t;
		
		self.renderer.begin_frame();
		self.root_graph.update(delta_t);
		self.renderer.end_frame();
				
		var dirty = self.active_graph_dirty;
				
		self.active_graph_dirty = false;
				
		return dirty; // Did connection state change?
	};
	
	this.onGraphSelected = function(graph)
	{
		self.active_graph.destroy_ui();
		self.active_graph = graph;
		
		// TODO: Fix this up later. We need to reset this position to make
		// copy / paste and switching graphs more humane, but right now this 
		// introduces a bug in the connection rendering logic for some (copied)
		// nested subgraphs.
		
		/*E2.dom.canvas_parent.scrollTop(0);
		E2.dom.canvas_parent.scrollLeft(0);
		self.scrollOffset = [0, 0];*/
		
		// Clear the current breadcrumb elements and rebuild.
		E2.dom.breadcrumb.children().remove();
		self.active_graph.build_breadcrumb(E2.dom.breadcrumb, false);
		
		self.active_graph.create_ui();
		self.active_graph.reset();
		self.active_graph_dirty = true;
	};
	
	this.create_dialog = function(diag, title, w, h, done_func, open_func)
	{
		diag.dialog(
		{
			title: title,
			width: w,
			height: h,
			modal: true,
			resizable: false,
			buttons:
			{
				'OK': function()
				{
					done_func();
					$(this).dialog('destroy');
					diag.remove();
				},
				'Cancel': function()
				{
					$(this).dialog('destroy');
					diag.remove();
				}
			},
			open: function()
			{
				if(open_func)
					open_func();
				
				diag.keyup(function(e)
				{
					if(e.keyCode === $.ui.keyCode.ENTER && done_func(e) !== false)
					{
						$(this).dialog('destroy');
						diag.remove();
					}
				});
			}
		});
	};
	
	this.get_default_value = function(dt)
	{
		var dts = self.datatypes;
		
		if(dt === dts.FLOAT)
			return 0.0;
		else if(dt === dts.COLOR)
			return new Color(1, 1, 1);
		else if(dt === dts.MATRIX)
		{
			var m = mat4.create();
	
			mat4.identity(m);
			return m;
		}
		else if (dt === dts.TEXTURE)
			return self.renderer.default_tex;
		else if(dt === dts.VECTOR)
			return [0.0, 0.0, 0.0];
		else if(dt === dts.CAMERA)
			return new Camera(self.renderer.context);
		else if(dt === dts.BOOL)
			return false;
		else if(dt === dts.MATERIAL)
			return new Material();
		else if(dt === dts.TEXT)
			return '';
		else if(dt === dts.ARRAY)
		{
			var a = new ArrayBuffer(0);
			
			a.stride = a.datatype = 1; // Uint8
			return a;
		}
		else if(dt === dts.OBJECT)
			return {};
		
		// Shaders, textures, scenes, light and delegates and ALL legally defaults to null.
		return null;
	};
	
	this.serialise = function()
	{
		var d = {};
		
		d.abs_t = Math.round(self.abs_t * Math.pow(10, 4)) / Math.pow(10, 4);
		d.active_graph = self.active_graph.uid;
		d.graph_uid = self.graph_uid;
		d.root = self.root_graph.serialise();
		this.registers.serialise(d);
		
		return JSON.stringify(d, undefined, 4);
	};
	
	this.deserialise = function(str)
	{
		var d = JSON.parse(str);
		
		self.abs_t = d.abs_t;
		self.delta_t = 0.0;
		self.graph_uid = d.graph_uid;

		self.active_graph.destroy_ui();
		
		var graphs = self.graphs = [];
		
		self.root_graph = new Graph(this, null, null);
		self.root_graph.deserialise(d.root);
		self.graphs.push(self.root_graph);
		
		if(d.registers)
			self.registers.deserialise(d.registers);
		
		self.root_graph.patch_up(self.graphs);
		self.root_graph.initialise(self.graphs);
			
		self.active_graph = resolve_graph(self.graphs, d.active_graph); 
		
		if(E2.dom.structure)
		{
			self.rebuild_structure_tree();
			self.active_graph.tree_node.activate();
		}
	};
	
	this.rebuild_structure_tree = function()
	{
		E2.dom.structure.dynatree('getRoot').removeChildren();
		var build = function(graph, name)
		{
			var nodes = graph.nodes;
			var pnode = graph.parent_graph !== null ? graph.parent_graph.tree_node : E2.dom.structure.dynatree('getRoot');
			var tnode = pnode.addChild({
				title: name,
				expand: graph.open
			});

			graph.tree_node = tnode;
			tnode.graph = graph;

			for(var i = 0, len = nodes.length; i < len; i++)
			{
				var n = nodes[i];

				if(n.plugin.e2_is_graph)
					build(n.plugin.graph, n.get_disp_name());
			}
		};

		build(self.root_graph, 'Root');
	};
	
	this.add_aux_script = function(script_url)
	{
		if(self.aux_scripts.hasOwnProperty(script_url))
			return;
		
		load_script('plugins/' + script_url);
		self.aux_scripts[script_url] = true;
	};

	this.add_aux_style = function(style_url)
	{
		if(self.aux_styles.hasOwnProperty(style_url))
			return;
		
		load_style('plugins/' + style_url);
		self.aux_styles[style_url] = true;
	};
}

E2.InitialiseEngi = function()
{
	E2.dom.canvas_parent = $('#canvas_parent');
	E2.dom.canvas = $('#canvas');
	E2.dom.controls = $('#controls');
	E2.dom.webgl_canvas = $('#webgl-canvas');
	E2.dom.left_nav = $('#left-nav');
	E2.dom.dbg = $('#dbg');
	E2.dom.play = $('#play');
	E2.dom.pause = $('#pause');
	E2.dom.stop = $('#stop');
	E2.dom.layout = $('#layout');
	E2.dom.refresh = $('#refresh');
	E2.dom.save = $('#save');
	E2.dom.dl_graph = $('#dl-graph');
	E2.dom.open = $('#open');
	E2.dom.load_clipboard = $('#load-clipboard');
	E2.dom.structure = $('#structure');
	E2.dom.info = $('#info');
	E2.dom.tabs = $('#tabs');
	E2.dom.graphs_list = $('#graphs-list');
	E2.dom.snippets_list = $('#snippets-list');
	E2.dom.breadcrumb = $('#breadcrumb');
	E2.dom.load_spinner = $('#load-spinner');

	E2.dom.filename_input = $('#filename-input');

	$.ajaxSetup({ cache: false });

	msg('Welcome to WebFx. ' + (new Date()));
	
	E2.dom.dbg.ajaxError(function(e, jqxhr, settings, ex) 
	{
		if(settings.dataType === 'script' && !settings.url.match(/^plugins\/all.plugins\.js/)) 
		{
			if(typeof(ex) === 'string')
			{
				msg(ex);
				return;
			}
				
			var m = 'ERROR: Script exception:\n';
			
			if(ex.fileName)
				m += '\tFilename: ' + ex.fileName;
				
			if(ex.lineNumber)
				m += '\tLine number: ' + ex.lineNumber;
			
			if(ex.message)
				m += '\tMessage: ' + ex.message;
				
			msg(m);
		}
	});

	E2.app = new Application();

	E2.dom.structure.dynatree({
		title: "Structure",
		fx: { height: 'toggle', duration: 200 },
		clickFolderMode: 1, // Activate, don't expand.
		selectMode: 1, // Single.
		debugLevel: 0, // Quiet.
		dnd: {
			preventVoidMoves: true,
			onDragStart: function(node)
			{
				return true;
			},
			onDragEnter: function(node, src)
			{
				if(node.parent !== src.parent)
					return false;

				return ['before', 'after'];
			},
			onDrop: function(node, src, hit_mode, ui, draggable)
			{
				src.move(node, hit_mode);
				node.parent.graph.reorder_children(node, src, hit_mode);
			}
		},
		onActivate: function(node) 
		{
			E2.app.clearEditState();
			E2.app.clearSelection();
			E2.app.player.core.onGraphSelected(node.graph);
			E2.app.updateCanvas(true);
		}
	});

	var root_node = E2.dom.structure.dynatree('getRoot');

	E2.app.player = new Player(E2.dom.webgl_canvas, E2.app, root_node.addChild({
		title: 'Root',
		isFolder: true,
		expand: true
	}));

	E2.dom.save.click(E2.app.onSaveClicked);
	E2.dom.open.click(E2.app.onOpenClicked);
	E2.dom.layout.click(E2.app.onLayoutClicked);

	E2.dom.play.click(E2.app.onPlayClicked);
	E2.dom.pause.click(E2.app.onPauseClicked);
	E2.dom.stop.click(E2.app.onStopClicked);

	E2.app.onWindowResize();
	setup_location_hash();
}

function reset_tree() {
	var tree = E2.dom.structure._tree
	tree('loadData', { data: [ {} ] })
	return tree;
}

function create_tree() {
	E2.dom.structure._tree = E2.dom.structure.tree.bind(E2.dom.structure);
	var tree = E2.dom.structure._tree;
	tree({
		data: [],
		slide: false,
		dragAndDrop: true,
		onCanMoveTo: function(moved_node, target_node, position) {
			if (!position || !moved_node.parent.parent)
				return false;

			var can = ((position === 'inside' && moved_node.parent === target_node)
				|| (position !== 'inside' && moved_node.parent === target_node.parent))
			console.log('can move ', moved_node.name, 'to', target_node.name, position, can)
			return can
		}
	})

	var tree_root = tree('getTree')

	function graph_selected(evt) {
		E2.app.clearEditState();
		E2.app.clearSelection();
		E2.app.player.core.onGraphSelected(evt.node.graph);
		E2.app.updateCanvas(true);
	}

	E2.dom.structure.bind('tree.select', graph_selected);
	E2.dom.structure.bind('tree.move', function(event) {
        var position = event.move_info.position;

        // var target = position === 'inside' ? event.move_info.target_node : event.move_info.target_node.parent;
        var target = event.move_info.target_node;

        var node = event.move_info.moved_node
        console.log('moved node', node, 'to', position, target)
        node.parent.graph.reorder_children(target, node, position);
	});

	return tree_root;	
}

function load_location_hash() {
	var graphName = decodeURIComponent(window.location.hash).replace('#'+URL_GRAPHS,'')
	console.log('loading graph from location hash:', graphName)
	E2.dom.filename_input.val(graphName);
	E2.app.onStopClicked();
	E2.app.player.on_update();
	E2.app.player.load_from_url(URL_GRAPHS+graphName);
	E2.app.updateCanvas(false);
}

function setup_location_hash() {
	$(window).on('hashchange', load_location_hash)

	$(document).ready(function() {
		if (window.location.hash) {
			setTimeout(load_location_hash, 1000)
		}
	})
}

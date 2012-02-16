/*
To do:

1. Finish post-deserialisation patchup code and verify operation with all plugins.
2. Fix bug in camera operation. Especially the perspective camera.
3. Implement dynamic slots and nested graphs.
4. Begin timeline implementation.
 
*/

var app = null;
var g_Plugins = {};
var g_DOM = {};

function msg(txt)
{
	var d = g_DOM.dbg;

	d.append(txt + '\n');
	d.scrollTop(d[0].scrollHeight);
}

function make(tag)
{
	return $(document.createElement(tag));
}

function make_menu_item(id, nested)
{
	var li = make('li');
	var a = make('a');
	
	a.text(id);
	li.append(a);
	
	a.attr('href', '#' + ((nested === null) ? id : ''));

	if(nested !== null)
		li.append(nested);
	
	return li;
}

function sort_dict(dict)
{
	var s = [], key;
	
	for(key in dict)
		s.push(key);
		
	s.sort();
	return s;
}

function resolve_graph(graphs, guid)
{
	for(var i = 0, len = graphs.length; i < len; i++)
	{
		if(graphs[i].uid === guid)
			return graphs[i]; 
	}

	if(guid !== -1)
		msg('ERROR: Failed to resolve graph with uid = ' + guid);
	
	return null;
};

function PluginGroup(id)
{
	var self = this;
	
	this.id = id;
	this.children = {};
	this.entries = {};
	
	this.get_or_create_group = function(id)
	{
		var g = self.children[id];
		
		if(!g)
		{
			g = new PluginGroup(id);
			self.children[id] = g;
		}
		
		return g;
	};
	
	this.add_entry = function(name, id)
	{
		var e = self.entries[name];
		
		assert(!e, 'Plugin keys must be unique, but a duplicate instance of the key "' + id + '" was found in plugins.json.');
	
		self.entries[name] = id;
	};
	
	this.insert_relative = function(key, id)
	{
		var tokens = key.split('/');
		
		assert(tokens.length > 0, 'Plugin key cannot be empty.');
		
		var g = self, len = tokens.length - 1;
		
		for(var i = 0; i < len; i++)
			g = g.get_or_create_group(tokens[i]);
		
		var key = tokens[len];
		
		g.add_entry(key, id);
		
		return key;
	};
	
	this.create_items = function()
	{
		var items = {}
		var sorted = sort_dict(self.children);
		
		for(var i = 0, len = sorted.length; i < len; i++)
		{
			var id = sorted[i];
			var child = self.children[id];
	
			items[id] = { name: id, items: child.create_items() };
		}
		
		sorted = sort_dict(self.entries);
		
		for(var i = 0, len = sorted.length; i < len; i++)
		{
			var id = sorted[i];
			var entry = self.entries[id];
			
			items[entry] = { name: id };
		}
			
		return items;
	};
}

function PluginManager(core, base_url) 
{
	var self = this;

	this.base_url = base_url;
	this.core = core;
	this.keybyid = {};
	this.release_mode = false;
	
	// First check if we're running a release build by checking for the existence
	// of 'all.plugins.js'
	var url = self.base_url + '/all.plugins.js';
	
	$.ajax({
		url: url,
		dataType: 'script',
		async: false,
		success: function(data, status) 
		{
			if(status == 'success')
			{	
				msg('PluginMgr: Running in release mode');
				self.release_mode = true;
			}
		},
		error: function()
		{
			msg('PluginMgr: Running in debug mode');
		}
	});

	this.register_plugin = function(pg_root, key, id)
	{
		self.keybyid[id] = pg_root.insert_relative(key, id);
		msg('Loaded ' + id);
	};

	$.ajax({
		url: self.base_url + '/plugins.json',
		dataType: 'json',
		async: false,
		success: function(data)
		{
			var menu = make('ul');
			var pg_root = new PluginGroup('root');
			
			$.each(data, function(key, id) 
			{
				// Load the plugin, constrain filenames.
				var url = self.base_url + '/' + id + '.plugin.js';

   				if(!self.release_mode)
   				{
	   				$.ajax({
						url: url,
						dataType: 'script',
						async: false,
						success: (function(id) { return function(data, status) 
						{
							if(status == 'success')
								self.register_plugin(pg_root, key, id)
							else
								msg('Failed to load plugin \'' + id + '\'');
						}})(id)
					});
   				}
   				else
   					self.register_plugin(pg_root, key, id);
			});
			
			var items = pg_root.create_items();
			
			$.contextMenu({
				selector: '#canvas_parent',
				callback: app.onPluginInstantiated,
				animation: { show: 'show', hide: 'hide' },
				zIndex: 10000,
				items: items 
			});
  		}
	});
	
	this.create = function(id) 
	{
		if(g_Plugins.hasOwnProperty(id))
		{
			var p = new g_Plugins[id](self.core);
			
			p.id = id;
			
			return p;
		}
			 
		msg('Failed to resolve plugin with id \'' + id + '\'. Please check that the right id is specified by the plugin implementation.');
		return null;
	}
}
 
function ConnectionUI(parent_conn)
{
	var self = this;
	
	this.src_pos = [0, 0];
	this.dst_pos = [0, 0];
	this.src_slot_div = null;
	this.dst_slot_div = null;
	this.flow = false;
	this.selected = false;
	this.parent_conn = parent_conn;
	this.offset = 0;
	
	this.serialise = function()
	{
		var d = {};
		
		d.src_pos = [Math.round(self.src_pos[0]), Math.round(self.src_pos[1])];
		d.dst_pos = [Math.round(self.dst_pos[0]), Math.round(self.dst_pos[1])];
		d.offset = self.offset;
		
		return d;
	};
	
	this.deserialise = function(d)
	{
		self.src_pos = d.src_pos;
		self.dst_pos = d.dst_pos;
		self.offset = d.offset;
	};
}

function Connection(src_node, dst_node, src_slot, dst_slot)
{
	this.src_node = src_node;
	this.dst_node = dst_node;
	this.src_slot = src_slot;
	this.dst_slot = dst_slot;
	this.ui = null;
	this.cached_value = null;
	
	var self = this;
	
	this.create_ui = function()
	{
		self.ui = new ConnectionUI(self);
	};
	
	this.destroy_ui = function()
	{
		if(self.ui)
			self.ui = null;
	};
	
	this.toString = function()
	{
		return 'connection from ' + self.src_node.uid + '(' + self.src_slot.index + ') to ' + self.dst_node.uid + '(' + self.dst_slot.index + ')';
	}

	this.serialise = function()
	{
		var d = {};
		
		d.src_nuid = self.src_node.uid;
		d.dst_nuid = self.dst_node.uid;
		d.src_slot = self.src_slot.index;
		d.dst_slot = self.dst_slot.index;
		d.ui = self.ui !== null;
		
		if(d.ui)
			d.ui_data = self.ui.serialise();
		
		return d;
	};
	
	this.deserialise = function(d)
	{
		// TODO: Patch up after load completes!
		self.src_node = d.src_nuid;
		self.dst_node = d.dst_nuid;
		self.src_slot = d.src_slot;
		self.dst_slot = d.dst_slot;
		self.cached_value = null;
		
		if(d.ui)
		{
			self.ui = new ConnectionUI(self);
			self.ui.deserialise(d.ui_data);
		}
	};
	
	this.patch_up = function(nodes)
	{
		var resolve_node = function(nuid)
		{
			for(var i = 0, len = nodes.length; i < len; i++)
			{
				if(nodes[i].uid === nuid)
					return nodes[i];
			}
			
			msg('ERROR: Failed to resolve node with uid = ' + nuid);
			return null;
		};
		
		self.src_node = resolve_node(self.src_node);
		self.dst_node = resolve_node(self.dst_node);
		
		if(self.ui)
		{
			self.ui.src_slot_div = self.src_node.ui.dom.find('#n' + self.src_node.uid + 'so' + self.src_slot);
			self.ui.dst_slot_div = self.dst_node.ui.dom.find('#n' + self.dst_node.uid + 'si' + self.dst_slot);
		}
		
		self.src_slot = self.src_node.plugin.output_slots[self.src_slot];
		self.dst_slot = self.dst_node.plugin.input_slots[self.dst_slot];

		self.src_node.outputs.push(self);
		self.dst_node.inputs.push(self);
	}
}

function NodeUI(parent_node, x, y) {
	this.parent_node = parent_node;
	this.x = x;
	this.y = y;
	this.plugin_ui = null;
	
	var render_slots = function(nid, col, slots, type)
	{
		for(var i = 0, len = slots.length; i < len; i++)
		{
			var s = slots[i];
			var div = make('div');
			
			div.attr('id', nid + (type === 0 ? 'si' : 'so') + i);
			div.text(s.name);
			div.addClass('pl_slot');
			div.disableSelection();
			div.definition = s;
			
			div.mouseenter(app.onSlotEntered(parent_node, s, div));
			div.mouseleave(app.onSlotExited(parent_node, s, div));
			div.mousedown(app.onSlotClicked(parent_node, s, div, type));
			
			col.append(div);
		}
	};
	
	var nid = 'n' + parent_node.uid;
	
	this.dom = make('table');
	this.dom.addClass('plugin');
	this.dom.addClass('ui-widget-content');
	this.dom.attr('id', nid);
	this.dom.mousemove(app.onMouseMoved); // Make sure we don't stall during slot connection, when the mouse enters a node.
	
	this.dom.css('top', '' + y + 'px');
	this.dom.css('left', '' + x + 'px');
	
	this.dom.addClass('pl_layout');
	
	var h_row = make('tr');
	var h_cell = make('td');
	
	h_cell.text(parent_node.title === null ? parent_node.id : parent_node.title);
	h_cell.attr('id', 't');
	h_cell.attr('colspan', '3');
	h_cell.disableSelection();
	h_row.append(h_cell);
	h_row.addClass('pl_header');
	h_row.click(app.onNodeHeaderClicked);
	h_row.dblclick(app.onNodeHeaderDblClicked(parent_node));
	h_row.mouseenter(app.onNodeHeaderEntered(parent_node));
	h_row.mouseleave(app.onNodeHeaderExited);
	this.dom.append(h_row);
	
	this.header_row = h_row;
	
	var row = make('tr');
	
	this.dom.append(row)
	
	var input_col = make('td');
	var content_col = make('td');
	var output_col = make('td');
	
	input_col.css('text-align', 'left');
	content_col.addClass('pui_col');
	output_col.css('text-align', 'right');
	
	row.append(input_col)
	row.append(content_col)
	row.append(output_col)
	
	render_slots(nid, input_col, parent_node.plugin.input_slots, 0);
	render_slots(nid, output_col, parent_node.plugin.output_slots, 1);
	
	var plugin = parent_node.plugin;
	
	if(plugin.create_ui)
	{
		this.plugin_ui = plugin.create_ui();
		
		content_col.append(this.plugin_ui);
	}
	
	this.dom.draggable({
		drag: app.onNodeDragged(parent_node),
		stop: app.onNodeDragStopped(parent_node)
    	});
	
	this.dom.css('display', 'none');
	g_DOM.canvas_parent.append(this.dom);
	this.dom.show('fast');
}

function Node(parent_graph, plugin_id, x, y) {
	var self = this;
	
	this.inputs = [];
	this.outputs = [];
	
	self.set_plugin = function(plugin)
	{
		self.plugin = plugin;
		
		// Decorate the slots with their index to make this immediately resolvable
		// from a slot reference, allowing for faster code elsewhere.
		// Additionally tagged with the type (0 = input, 1 = output) for similar reasons.
		for(var i = 0, len = plugin.input_slots.length; i < len; i++)
		{
			var s = plugin.input_slots[i];
		
			s.index = i;
			s.type = 0;
		}
		
		for(var i = 0, len = plugin.output_slots.length; i < len; i++)
		{
			var s = plugin.output_slots[i];
		
			s.index = i;
			s.type = 1;
		}
	};
		
	if(plugin_id !== null) // Don't initialise if we're loading.
	{
		this.parent_graph = parent_graph;
		this.x = x;
		this.y = y;
		this.ui = null;
		this.id = app.core.plugin_mgr.keybyid[plugin_id];
		this.uid = parent_graph.get_node_uid();
		this.is_updated = false;
		this.title = null;
		
		self.set_plugin(app.core.plugin_mgr.create(plugin_id));
	}
	
	this.create_ui = function()
	{
		self.ui = new NodeUI(self, self.x, self.y);
	};
	
	this.destroy_ui = function()
	{
		if(self.ui)
		{
			self.ui.dom.hide('fast', function()
			{
				self.ui.dom.remove();
				self.ui = null;
			});
		}
	};
	
	this.destroy = function()
	{
		var graph = self.parent_graph;
		var index = graph.nodes.indexOf(self);
		var pending = [];
		
		if(index != -1)
			graph.nodes.splice(index, 1);
		
		for(var i = 0, len = self.inputs.length; i < len; i++)
			pending.push(self.inputs[i]);

		for(var i = 0, len = self.outputs.length; i < len; i++)
			pending.push(self.outputs[i]);

		for(var i = 0, len = pending.length; i < len; i++)
			graph.destroy_connection(pending[i]);
		
		self.destroy_ui();
	}
	
	this.update_recursive = function(conns, delta_t)
	{
		if(self.is_updated)
			return;
		
		var uid = self.uid;
		var inputs = self.inputs;
		var needs_update = false;
		var s_plugin = self.plugin;
		var dirty = false;
		
		self.plugin.needs_update = false;
		
		for(var i = 0, len = inputs.length; i < len; i++)
		{
			var inp = inputs[i];
			
			dirty = inp.src_node.update_recursive(conns, delta_t) || dirty;
			
			var value = inp.src_node.plugin.update_output(inp.src_slot.index);
			
			if(inp.src_node.plugin.needs_update || value !== inp.cached_value)
			{
				self.plugin.update_input(inp.dst_slot.index, value);
				inp.cached_value = value;
				needs_update = true;
				
				if(inp.ui && !inp.ui.flow)
				{
					dirty = true;
					inp.ui.flow = true;
				}
			}
			else if(inp.ui && inp.ui.flow)
			{
				inp.ui.flow = false;
				dirty = true;
			}
		}
		
		if(needs_update || self.plugin.output_slots.length === 0)
		{
			if(s_plugin.update_state)
				s_plugin.update_state(delta_t);

			s_plugin.needs_update = true;
		}
		
		self.is_updated = true;
		
		return dirty;
	}
	
	this.serialise = function()
	{
		var d = {};
		
		d.parent_uid = self.parent_graph.uid;
		d.plugin = self.plugin.id;
		d.state = self.plugin.state || null;
		d.x = Math.round(self.x);
		d.y = Math.round(self.y);
		d.ui = self.ui != null;
		d.uid = self.uid;
		d.title = self.title;
		
		return d;
	};
	
	this.deserialise = function(d)
	{
		self.parent_graph = d.parent_uid; // TODO: Patch up after load completes!
		self.x = d.x;
		self.y = d.y;
		self.id = app.core.plugin_mgr.keybyid[d.plugin];
		self.uid = d.uid;
		self.title = d.title;
		
		self.set_plugin(app.core.plugin_mgr.create(d.plugin));
		
		if(d.ui)
			self.ui = new NodeUI(self, self.x, self.y);

		if(d.state != null)
		{
			self.plugin.state = d.state;
		
			if(self.plugin.state_changed)
				self.plugin.state_changed(self.ui ? self.ui.plugin_ui : null);
		}
	};
	
	this.patch_up = function(graphs)
	{
		self.parent_graph = resolve_graph(graphs, self.parent_graph);
	}
}


function Graph(parent_graph, tree_node) 
{
	var self = this;
	
	this.uid = app.core.get_graph_uid();
	this.parent_graph = parent_graph;
	this.nodes = [];
	this.roots = [];
	this.connections = [];
	this.node_uid = 0;
	this.tree_node = tree_node;
	
	this.get_node_uid = function()
	{
		return self.node_uid++;
	};
	
	this.create_instance = function(plugin_id, x, y)
	{
		n = new Node(self, plugin_id, x, y);
		
		self.nodes.push(n);
		
		if(n.plugin.output_slots.length == 0)
			self.roots.push(n);
		
		return n;
	};
	
	this.update = function(delta_t)
	{
		var nodes = self.nodes;
		var roots = self.roots;
		var dirty = false;
		
		for(var i = 0, len = nodes.length; i < len; i++)
			nodes[i].is_updated = false;
		
		for(var i = 0, len = roots.length; i < len; i++)
			dirty = roots[i].update_recursive(self.connections, delta_t) || dirty;
		
		return dirty;
	};
	
	this.reset = function()
	{
		var conns = self.connections;
		
		for(var i = 0, len = conns.length; i < len; i++)
		{
			var c = conns[i];
			
			c.cached_value = null;

			if(c.ui && c.ui.flow)
			{
				c.ui.flow = false;
				c.ui.color = '#000';
			}
		}
			
		var nodes = self.nodes;
		
		for(var i = 0, len = nodes.length; i < len; i++)
		{
			var n = nodes[i];
			
			if(n.plugin.reset)
				n.plugin.reset();
		}
	};
	
	this.destroy_connection = function(c)
	{
		var index = self.connections.indexOf(c);
		
		if(index != -1)
			self.connections.splice(index, 1);
		
		c.src_slot.is_connected = false;
		c.dst_slot.is_connected = false;
		
		index = c.dst_node.inputs.indexOf(c);
		
		if(index != -1)
			c.dst_node.inputs.splice(index, 1);
	};
	
	this.destroy_ui = function()
	{
		var nodes = self.nodes;
		
		for(var i = 0, len = nodes.length; i < len; i++)
			nodes[i].destroy_ui()
	};
	
	this.find_connections_from = function(node, slot)
	{
		if(slot.type !== 1)
			return [];
		
		var conns = self.connections;
		var uid = node.uid;
		var result = [];
		
		for(var i = 0, len = conns.length; i < len; i++)
		{
			var c = conns[i];
			
			if(c.src_node.uid === uid && c.src_slot === slot)
				result.push(c);			
		}
		
		return result;
	};
	
	this.serialise = function()
	{
		var d = {};
		
		d.node_uid = self.node_uid;
		d.uid = self.uid;
		d.parent_uid = self.parent_graph ? self.parent_graph.uid : -1;
		
		d.nodes = [];
		
		for(var i = 0, len = self.nodes.length; i < len; i++)
			d.nodes.push(self.nodes[i].serialise());
			
		d.conns = [];
		
		for(var i = 0, len = self.connections.length; i < len; i++)
			d.conns.push(self.connections[i].serialise());

		return d;
	};
	
	this.deserialise = function(d)
	{
		self.node_uid = d.node_uid;
		self.uid = d.uid;
		self.parent_graph = d.parent_uid; // TODO: Patch up when all graphs are loaded!
		
		self.nodes = [];
		self.roots = [];
		
		for(var i = 0, len = d.nodes.length; i < len; i++)
		{
			var n = new Node(null, null, null, null);
			
			n.deserialise(d.nodes[i]);
			self.nodes.push(n);
			
			if(n.plugin.output_slots.length == 0)
				self.roots.push(n);
		}

		self.connections = [];

		for(var i = 0, len = d.conns.length; i < len; i++)
		{
			var c = new Connection(null, null, null, null);
			
			c.deserialise(d.conns[i]);
			self.connections.push(c);
		}
	};
	
	this.patch_up = function(graphs)
	{
		var nodes = self.nodes, conns = self.connections;
		
		self.parent_graph = resolve_graph(graphs, self.parent_graph);
		
		for(var i = 0, len = nodes.length; i < len; i++)
			nodes[i].patch_up(graphs); 

		for(var i = 0, len = conns.length; i < len; i++)
			conns[i].patch_up(nodes);
			
		self.reset();
	};
}

function Core() {
	var self = this;
	
	this.datatypes = {
		FLOAT: { id: 0, name: 'Float' },
		SHADER: { id: 1, name: 'Shader' },
		TEXTURE: { id: 2, name: 'Texture' },
		COLOR: { id: 3, name: 'Color' },
		TRANSFORM: { id: 4, name: 'Transform' },
		VERTEX: { id: 5, name: 'Vertex' },
		CAMERA: { id: 6, name: 'Camera' }
	};
	
	this.renderer = new Renderer('#webgl-canvas');
	this.active_graph = this.root_graph = null;
	this.graphs = [];
	
	this.abs_t = 0.0;
	this.delta_t = 0.0;
	this.graph_uid = 0;
	
	this.get_graph_uid = function()
	{
		return self.graph_uid++;
	};
	
	this.update = function(abs_t, delta_t)
	{
		self.abs_t = abs_t;
		self.delta_t = delta_t;
		self.renderer.update();
		
		return self.active_graph.update(delta_t); // Did connection state change?
	}
	
	this.serialise = function()
	{
		var d = {};
		
		d.abs_t = self.abs_t;	
		d.active_graph = self.active_graph.serialise();
		d.graph_uid = self.graph_uid;
		
		return JSON.stringify(d);
	}
	
	this.deserialise = function(str)
	{
		var d = JSON.parse(str);
		
		self.abs_t = d.abs_t;
		self.delta_t = 0.0;
		self.graph_uid = d.graph_uid;
		
		self.graphs = [];
		
		self.active_graph.destroy_ui();
		self.active_graph.deserialise(d.active_graph);
		self.graphs.push(self.active_graph);
		self.active_graph.patch_up(self.graphs);
	}
}

function Application() {
	var canvas_parent = $("#canvas_parent");
	var canvas = $("#canvas");
		
	this.state = {
		STOPPED: 0,
		PLAYING: 1,
		PAUSED: 2
	};
	
	this.core = new Core();
	this.canvas = canvas;
	this.c2d = canvas[0].getContext('2d');
	this.src_node = null;
	this.dst_node = null;
	this.src_slot = null;
	this.src_slot_div = null;
	this.dst_slot = null;
	this.dst_slot_div = null;
	this.edit_conn = null;
	this.last_mouse_pos = [0, 0];
	this.current_state = this.state.STOPPED;
	this.interval = null;
	this.abs_time = 0.0;
	this.last_time = (new Date()).getTime();
	this.shift_pressed = false;
	this.hover_slot = null;
	this.hover_slot_div = null;
	this.hover_connections = [];
	this.hover_node = null;
	this.scrollOffset = [0, 0];
	
	var self = this;
	
	this.getNIDFromSlot = function(id)
	{
		return parseInt(id.slice(1, id.indexOf('s')));
	};
	
	this.getSIDFromSlot = function(id)
	{
		return parseInt(id.slice(id.indexOf('s') + 2, id.length));
	};
	
	this.offsetToCanvasCoord = function(ofs)
	{
		var o = [ofs .left, ofs.top];
		var co = canvas_parent.offset();
		var so = self.scrollOffset;
		
		o[0] -= co.left;
		o[1] -= co.top;
		o[0] += so[0];
		o[1] += so[1];
		
		return o;
	};
	
	this.getSlotPosition = function(slot_div, type)
	{
		var o = self.offsetToCanvasCoord(slot_div.offset());
		var x = type == 0 ? o[0] : o[0] + slot_div.width();
		
		return [x, o[1] + (slot_div.height() / 2)];
	};
	
	this.onPluginInstantiated = function(id, opt)
	{	
		var pos = opt.$menu.offset();
		var cp = canvas_parent;
		var co = cp.offset();
		var createPlugin = function(name)
		{
			var node = self.core.active_graph.create_instance(id, (pos.left - co.left) + cp.scrollLeft(), (pos.top - co.top) + cp.scrollTop());
		
			if(node.plugin.reset)
				node.plugin.reset();

			if(name !== null) // Graph?
			{
				node.title = name;
				node.plugin.state.graph.tree_node = node.parent_graph.tree_node.addChild({
					title: name,
					isFolder: true
				});
			}
			
			node.create_ui();			
		};
		
		if(id === 'graph')
		{
			var diag = make('div');
			var inp = $('<input type="input" value="graph(' + self.core.active_graph.node_uid + ')" />'); 
		
			inp.css('width', '410px');
			diag.append(inp);
		
			diag.dialog({
				width: 460,
				height: 150,
				modal: true,
				title: 'Name new graph.',
				show: 'slide',
				hide: 'slide',
				buttons: {
					'OK': function()
					{
						createPlugin(inp.val());
						$(this).dialog('close');
					},
					'Cancel': function()
					{
						$(this).dialog('close');
					}
				},
				open: function(i) { return function()
				{
					i.focus().select();
				}}(inp)
			});
		}
		else
			createPlugin(null);
	};
	
	this.onSlotClicked = function(node, slot, slot_div, type) { return function(e)
	{
		e.stopPropagation();
		
		if(!self.shift_pressed && type == 1)
		{
			self.src_node = node;
			self.src_slot = slot;
			self.src_slot_div = slot_div;
			self.edit_conn = new Connection(null, null, null, null);
			self.edit_conn.create_ui();
			self.edit_conn.ui.src_pos = self.getSlotPosition(slot_div, 1);
		
			var graph = self.core.active_graph;
			var ocs = graph.find_connections_from(node, slot);
			var offset = 0;
			
			ocs.sort(function(a, b) {
				return a.ui.offset < b.ui.offset ? - 1 : a.ui.offset > b.ui.offset ? 1 : 0;
			});
			
			for(var i = 0, len = ocs.length; i < len; i++)
			{
				var oc = ocs[i];
				
				oc.offset = i;

				if(oc.ui.offset != i)
				{
					offset = i;
					break;
				}
				
				offset = i + 1;
			}
			
			self.edit_conn.ui.offset = offset;
			slot_div.css('color', '#0f0');
		}
		
		if(self.shift_pressed)
			self.removeHoverConnections();
				
		return false;
	}};

	this.activateHoverSlot = function()
	{
		var hs = self.hover_slot;
		
		if(!hs)
			return;
		
		self.hover_slot_div.css('background-color', '#f00');
		
		// Mark any attached connection
		var conns = self.core.active_graph.connections;
		var dirty = false;
		
		for(var i = 0, len = conns.length; i < len; i++)
		{
			var c = conns[i];
			
			if(c.dst_slot === hs || c.src_slot === hs)
			{
				c.ui.selected = true;
				self.hover_connections.push(c);
				dirty = true;
								
				if(hs.type == 0)
					break; // Early out if this is an input slot, but continue searching if it's an output slot. There might be multiple connections.
			}
		}
		
		if(dirty)
			self.updateCanvas();
	}
	
	this.releaseHoverSlot = function()
	{
		if(self.hover_slot != null)
		{
			self.hover_slot_div.css('background-color', 'inherit');
			self.hover_slot_div = null;
			self.hover_slot = null;
		}
		
		var hcs = self.hover_connections;
		
		if(hcs.length > 0)
		{
			for(var i = 0, len = hcs.length; i < len; i++)
				hcs[i].ui.selected = false;

			self.hover_connections = [];
			self.updateCanvas();
		}
		
		if(self.dst_slot_div != null)
		{
			self.dst_slot_div.css('color', '#000');
			self.dst_slot_div = null;
		}

	}
	
	this.onSlotEntered = function(node, slot, slot_div) { return function(e)
	{
		if(self.src_slot)
		{
			self.dst_slot_div = slot_div;

			if(self.src_slot_div.definition.dt === slot.dt && !slot.is_connected) // Only allow connection if datatypes match and slot is unconnected.
			{
				self.dst_node = node;
				self.dst_slot = slot;
				slot_div.css('color', '#0f0');
			}
			else
			{
				self.dst_node = null;
				self.dst_slot = null;
				slot_div.css('color', '#f00');
			}
		}
		
		self.hover_slot = slot;
		self.hover_slot_div = slot_div;

		if(self.shift_pressed)
			self.activateHoverSlot();
	}};

	this.onSlotExited = function(node, slot, slot_div) { return function(e)
	{
		if(self.dst_node === node)
			self.dst_node = null;
		
		if(self.dst_slot === slot)
			self.dst_slot = null;
			
		self.releaseHoverSlot();
	}};
	
	this.drawConnection = function(c2d, conn)
	{
		var odd_scale = 0.84, // TODO: Where in the universe is this comming from?
		    c = conn.ui,
		    so = self.scrollOffset,
		    x1 = (c.src_pos[0] - so[0]) * odd_scale,
		    y1 = c.src_pos[1] - so[1],
		    x4 = (c.dst_pos[0] - so[0]) * odd_scale,
		    y4 = c.dst_pos[1] - so[1],
		    mx = (x1 + x4) / 2,
		    my = (y1 + y4) / 2,
		    x2 = Math.min(x1 + 10 + (c.offset * 5), mx);
		
		c2d.moveTo(x1, y1);
		c2d.lineTo(x2, y1);
		c2d.lineTo(x2, y4);
		c2d.lineTo(x4, y4);
	};
	
	this.updateCanvas = function()
	{
		var c = self.c2d;
		var canvas = self.canvas[0];
		 
		c.clearRect(0, 0, canvas.width, canvas.height);
		
		var conns = self.core.active_graph.connections;
		var cb = [[], [], []];
		var styles = ['#f00', '#44e', '#000'];
		
		for(var i = 0, len = conns.length; i < len; i++)
		{
			var con = conns[i];

			cb[con.ui.selected ? 0 : con.ui.flow ? 1 : 2].push(con);
		}
		
		if(self.edit_conn)
		{
			self.edit_conn.ui.dst_pos = self.last_mouse_pos.slice(0);
			cb[2].push(self.edit_conn);
		}
		
		for(var bin = 0; bin < 3; bin++)
		{
			var b = cb[bin];

			if(b.length > 0)
			{
				c.strokeStyle = styles[bin];
				c.beginPath();
			
				for(var i = 0, len = b.length; i < len; i++)
					self.drawConnection(c, b[i]);
				
				c.stroke()
			}
		}
	};
	
	this.onMouseMoved = function(e)
	{
		if(self.src_slot)
			self.updateCanvas();
		
		var ofs = canvas_parent.offset();
		
		self.last_mouse_pos = [(e.pageX - ofs.left) + self.scrollOffset[0], (e.pageY - ofs.top) + self.scrollOffset[1]];
	};
	
	this.onMouseReleased = function(e)
	{
		if(self.dst_node && self.dst_slot) // If dest_slot is set, we should create a permanent connection.
		{
			var ss = self.src_slot;
			var ds = self.dst_slot;
			var c = new Connection(self.src_node, self.dst_node, ss, ds);
			
			self.src_node.outputs.push(c);
			self.dst_node.inputs.push(c);
			
			// msg('New ' + c);

			c.create_ui();
			c.ui.src_pos = self.edit_conn.ui.src_pos.slice(0);
			c.ui.dst_pos = self.getSlotPosition(self.dst_slot_div);
			c.ui.src_slot_div = self.src_slot_div;
			c.ui.dst_slot_div = self.dst_slot_div;
			c.ui.offset = self.edit_conn.ui.offset;
			
			var graph = self.core.active_graph; 
			
			graph.connections.push(c);
			self.dst_node.plugin.needs_update = true;
			
			self.dst_slot_div.css('color', '#000');
			self.dst_slot.is_connected = true;
			self.dst_slot_div = null;
			self.dst_slot = null;
		}

		if(self.src_slot)
		{
			self.src_slot_div.css('color', '#000');
			self.src_slot = null;
			self.src_slot_div = null;
		}
		
		self.dst_node = null;
		self.src_node = null;
		self.edit_conn = null;
		self.updateCanvas();
	};
	
	this.activateHoverNode = function()
	{
		if(self.hover_node !== null)
		{
			self.hover_node.ui.header_row.css('background-color', '#f00');
		
			var hcs = self.hover_connections;
			var conns = self.core.active_graph.connections;
			var uid = self.hover_node.uid;
			
			for(var i = 0, len = conns.length; i < len; i++)
			{
				var c = conns[i];
				
				if(c.src_node.uid == uid || c.dst_node.uid == uid)
				{
					c.ui.selected = true;
					hcs.push(c);
				}
			}
			
			if(hcs.length > 0)
				self.updateCanvas();
		}
	};
	
	this.releaseHoverNode = function()
	{
		if(self.hover_node !== null)
		{
			self.hover_node.ui.header_row.css('background-color', '#dde'); // TODO: Ugly. All this belongs an a style sheet!
			self.hover_node = null;
			
			var hcs = self.hover_connections;
			
			if(hcs.length > 0)
			{
				for(var i = 0, len = hcs.length; i < len; i++)
					hcs[i].ui.selected = false;

				self.updateCanvas();
			}
		}
	};

	this.removeHoverConnections = function()
	{
			var hcs = self.hover_connections;
		
			if(hcs.length > 0)
			{
				var graph = self.core.active_graph;
			
				for(var i = 0, len = hcs.length; i < len; i++)
				{
					var c = hcs[i];
					var p = c.dst_node.plugin;
					
					// Signal the destruction of the connection to the target
					if(p.disconnect_input)
						p.disconnect_input(c.dst_slot.index);
					
					graph.destroy_connection(c);
				}
				
				self.hover_connections = [];
				self.updateCanvas();
			}
	};
		
	this.onNodeHeaderEntered = function(node) { return function(e)
	{
		self.hover_node = node;

		if(self.shift_pressed)
			self.activateHoverNode();
	}};
	
	this.onNodeHeaderExited = function(e)
	{
		self.releaseHoverNode();
		self.hover_node = null;
	};
	
	this.onNodeHeaderClicked = function(e)
	{
		e.stopPropagation();
		
		if(self.shift_pressed && self.hover_node !== null)
		{
			var hn = self.hover_node;
			
			self.releaseHoverNode();
			hn.destroy();
			
			self.updateCanvas();
			self.removeHoverConnections();
		}
		
		return false;
	};
	
	this.onNodeHeaderDblClicked = function(node) { return function(e)
	{
		var diag = make('div');
		var inp = $('<input type="input" value="' + (node.title === null ? node.id : node.title) + '" />'); 
	
		inp.css('width', '410px');
		diag.append(inp);
	
		diag.dialog({
			width: 460,
			height: 150,
			modal: true,
			title: 'Rename node.',
			show: 'slide',
			hide: 'slide',
			buttons: {
				'OK': function()
				{
					node.title = inp.val();
					
					if(node.ui !== null)
						node.ui.dom.find('#t').text(node.title);
					
					$(this).dialog('close');
				},
				'Cancel': function()
				{
					$(this).dialog('close');
				}
			},
			open: function(i) { return function()
			{
				i.focus().select();
			}}(inp)
		});
	}};
	
	this.onNodeDragged = function(node) { return function(e)
	{
		var conns = self.core.active_graph.connections;
		var uid = node.uid;
		var canvas_dirty = false;
		var pos = node.ui.dom.position();
		
		node.x = pos.left;
		node.y = pos.top;
		
		for(var i = 0, len = node.outputs.length; i < len; i++)
		{
			var c = node.outputs[i];
			
			c.ui.src_pos = self.getSlotPosition(c.ui.src_slot_div, 1);
		}
		
		for(var i = 0, len = node.inputs.length; i < len; i++)
		{
			var c = node.inputs[i];
			
			c.ui.dst_pos = self.getSlotPosition(c.ui.dst_slot_div, 0);
		}
		
		if(node.inputs.length + node.outputs.length > 0)
			self.updateCanvas();
	}};
	
	this.onNodeDragStopped = function(node) { return function(e)
	{
		self.onNodeDragged(node)(e);
	}};
	
	this.onKeyDown = function(e)
	{
		if(e.keyCode === 16) // .isShift doesn't work on Chrome.
		{
			self.shift_pressed = true;
			self.activateHoverSlot();
			self.activateHoverNode();
		}
	};
	
	this.onKeyUp = function(e)
	{
		if(e.keyCode === 16)
		{
			self.shift_pressed = false;
			self.releaseHoverSlot();
			self.releaseHoverNode();
		}
	};

	this.changeControlState = function()
	{
		var cs = self.current_state;
		
		g_DOM.play.button(cs == self.state.PLAYING ? 'disable' : 'enable');
		g_DOM.pause.button(cs == self.state.PAUSED || cs == self.state.STOPPED ? 'disable' : 'enable');
		g_DOM.stop.button(cs == self.state.STOPPED ? 'disable' : 'enable');
	}
	
	this.onPlayClicked = function()
	{
		self.current_state = self.state.PLAYING;
		self.changeControlState();
		
		self.last_time = (new Date()).getTime();
		self.interval = setInterval(function() {
			app.onUpdate();
		}, 0);
	};
	
	this.onPauseClicked = function()
	{
		self.current_state = self.state.PAUSED;
		self.changeControlState();
		
		if(self.interval != null)
		{
			clearInterval(self.interval);
			self.interval = null;
		}
	};

	this.onStopClicked = function()
	{
		self.abs_time = 0.0;
		self.current_state = self.state.STOPPED;
		self.changeControlState();
		
		if(self.interval != null)
		{
			clearInterval(self.interval);
			self.interval = null;
		}
		
		self.core.active_graph.reset();
		self.core.renderer.update(); // Clear the WebGL view.
		self.updateCanvas();
	};

	this.onSaveClicked = function()
	{
		g_DOM.persist.val(self.core.serialise());
	};
	
	this.onLoadClicked = function()
	{
		self.onStopClicked();
		self.core.deserialise(g_DOM.persist.val());
		self.updateCanvas();
	};

	this.onUpdate = function()
	{
		var time = (new Date()).getTime();
		var delta_t = (time - self.last_time) * 0.001;
		
		if(self.core.update(self.abs_time, delta_t))
			self.updateCanvas();
		
		g_DOM.frame.val(delta_t.toFixed(4));
		self.last_time = time;
		self.abs_time += delta_t;
	}
	
	$(document).mouseup(this.onMouseReleased);
	$(document).keydown(this.onKeyDown);
	$(document).keyup(this.onKeyUp);
	canvas.mousemove(this.onMouseMoved);
	canvas_parent.scroll(function()
	{
		self.scrollOffset = [ canvas_parent.scrollLeft(), canvas_parent.scrollTop() ];
		canvas.css('left', '' + self.scrollOffset[0] + 'px');
		canvas.css('top', '' + self.scrollOffset[1] + 'px');
		self.updateCanvas();
	});
	
	// If the user uses any of the existing browser SHIFT hotkey (like new tab!),
	// make sure we clear our hover state.
	$(window).blur(function()
	{
		self.shift_pressed = false;
		self.releaseHoverSlot();
		self.releaseHoverNode();
	});
	
	// Make sure all the input fields blur themselves when they gain focus --
	// otherwise they trap the control key document events. TODO: Surely there is a
	// better way to deal with this atrocious nonsense?
	g_DOM.play.focus(function(e) { g_DOM.play.blur(); });
	g_DOM.pause.focus(function(e) { g_DOM.pause.blur(); });
	g_DOM.stop.focus(function(e) { g_DOM.stop.blur(); });
	g_DOM.save.focus(function(e) { g_DOM.save.blur(); });
	g_DOM.load.focus(function(e) { g_DOM.load.blur(); });
}

$(document).ready(function() {
	g_DOM.canvas_parent = $('#canvas_parent');
	g_DOM.dbg = $('#dbg');
	g_DOM.play = $('#play');
	g_DOM.pause = $('#pause');
	g_DOM.stop = $('#stop');
	g_DOM.save = $('#save');
	g_DOM.load = $('#load');
	g_DOM.frame = $('#frame');
	g_DOM.persist = $('#persist');
	g_DOM.structure = $('#structure');
	
	$.ajaxSetup({ cache: false });
	
	$.fn.extend({ disableSelection: function() { 
			this.each(function() { 
				if (typeof this.onselectstart != 'undefined') {
					this.onselectstart = function() { return false; };
				} else if (typeof this.style.MozUserSelect != 'undefined') {
					this.style.MozUserSelect = 'none';
				} else {
					this.onmousedown = function() { return false; };
				}
			}); 
		} 
	});

	msg('Welcome to WebFx. ' + (new Date()));
	
	g_DOM.dbg.ajaxError(function(e, jqxhr, settings, exception) {
		if(settings.dataType=='script' && !settings.url.match(/^plugins\/all.plugins\.js/)) {
			msg(e + exception);
		}
	});

	app = new Application();
	app.core.plugin_mgr = new PluginManager(app.core, 'plugins');
	
	g_DOM.structure.dynatree({
		title: "Structure",
		fx: { height: 'toggle', duration: 200 },
		onActivate: function(node) 
		{
			alert(node.getKeyPath());
		}
	});
    
	var root_node = g_DOM.structure.dynatree('getRoot');
	var gn_root = root_node.addChild({
		title: 'Root',
		isFolder: true
	});	
	
	// TODO: Because graphs depend on the existence of the core singleton
	// we can't create graph instances in the core initialisation code. Moreover,
	// even though we could introduce a UID manager to move this out of the core,
	// where would *that* singleton live? In the core... Most awkward.
	// The alternative is to have the UID manager singleton be global? Ugh..
	app.core.active_graph = app.core.root_graph = new Graph(null, gn_root);
	app.core.graphs.push(app.core.root_graph);
	
	g_DOM.play.button({ icons: { primary: 'ui-icon-play' } }).click(app.onPlayClicked);
	g_DOM.pause.button({ icons: { primary: 'ui-icon-pause' }, disabled: true }).click(app.onPauseClicked);
	g_DOM.stop.button({ icons: { primary: 'ui-icon-stop' }, disabled: true }).click(app.onStopClicked);
	g_DOM.save.button({ icons: { primary: 'ui-icon-arrowreturnthick-1-s' } }).click(app.onSaveClicked);
	g_DOM.load.button({ icons: { primary: 'ui-icon-arrowreturnthick-1-n' } }).click(app.onLoadClicked);

  	msg('Ready.');	
	$('#content').css('display', 'block');
});
